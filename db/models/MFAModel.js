/**
 * MFA Model
 * Database operations for mfa_challenges table
 */

const db = require('../config');
const crypto = require('crypto');

// Hashing configuration
const HASH_ALGORITHM = 'sha256';

/**
 * Generate a SHA-256 hash of the OTP for secure storage
 * @param {string} otp - One-time password to hash
 * @returns {string} - SHA-256 hash of the OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash(HASH_ALGORITHM).update(String(otp)).digest('hex');
};

/**
 * Generate a cryptographically secure session token
 * @returns {string} - Hex-encoded random session token
 */
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const MFAModel = {
  /**
   * Create a new MFA challenge record with hashed OTP and expiry
   * @param {string} userId - User UUID
   * @param {string} otp - Plain-text OTP to hash and store
   * @param {number} expiryMinutes - Minutes until the challenge expires (default: 10)
   * @returns {Promise<object>} - Created challenge record including session token
   */
  createChallenge: async (userId, otp, expiryMinutes = 10) => {
    try {
      const sessionToken = generateSessionToken();
      const otpHash = hashOTP(otp);

      const query = `
        INSERT INTO mfa_challenges (
          user_id, session_token, otp_hash, expires_at, is_used, attempt_count
        )
        VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL, FALSE, 0)
        RETURNING id, user_id, session_token, expires_at, created_at;
      `;

      const result = await db.queryOne(query, [
        userId,
        sessionToken,
        otpHash,
        String(expiryMinutes),
      ]);

      return {
        success: true,
        challengeId: result.id,
        userId: result.user_id,
        sessionToken: result.session_token,
        expiresAt: result.expires_at,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('MFA challenge creation error:', error);
      throw error;
    }
  },

  /**
   * Retrieve an active (non-expired, non-used) MFA challenge by session token
   * @param {string} sessionToken - Session token associated with the challenge
   * @returns {Promise<object|null>} - Active challenge record or null if not found
   */
  getChallenge: async (sessionToken) => {
    try {
      const query = `
        SELECT id, user_id, session_token, otp_hash, expires_at,
               is_used, attempt_count, created_at
        FROM mfa_challenges
        WHERE session_token = $1
          AND is_used = FALSE
          AND expires_at > NOW();
      `;

      return await db.queryOne(query, [sessionToken]);
    } catch (error) {
      console.error('Get MFA challenge error:', error);
      throw error;
    }
  },

  /**
   * Retrieve an MFA challenge by session token regardless of status (for audit purposes)
   * @param {string} sessionToken - Session token associated with the challenge
   * @returns {Promise<object|null>} - Challenge record or null if not found
   */
  getChallengeByToken: async (sessionToken) => {
    try {
      const query = `
        SELECT id, user_id, session_token, otp_hash, expires_at,
               is_used, attempt_count, created_at
        FROM mfa_challenges
        WHERE session_token = $1;
      `;

      return await db.queryOne(query, [sessionToken]);
    } catch (error) {
      console.error('Get MFA challenge by token error:', error);
      throw error;
    }
  },

  /**
   * Verify a provided OTP against the stored hash for a given session token
   * @param {string} sessionToken - Session token associated with the challenge
   * @param {string} otp - Plain-text OTP provided by the user
   * @returns {Promise<object>} - Verification result with success flag and challenge details
   */
  verifyOTP: async (sessionToken, otp) => {
    try {
      const challenge = await MFAModel.getChallenge(sessionToken);

      if (!challenge) {
        return {
          success: false,
          error: 'Invalid or expired MFA challenge',
          code: 'CHALLENGE_NOT_FOUND',
        };
      }

      const otpHash = hashOTP(otp);
      const isValid = otpHash === challenge.otp_hash;

      return {
        success: isValid,
        challengeId: challenge.id,
        userId: challenge.user_id,
        attemptCount: challenge.attempt_count,
        error: isValid ? null : 'Invalid OTP',
        code: isValid ? null : 'INVALID_OTP',
      };
    } catch (error) {
      console.error('MFA OTP verification error:', error);
      throw error;
    }
  },

  /**
   * Mark an MFA challenge as used to prevent replay attacks
   * @param {string} sessionToken - Session token of the challenge to mark as used
   * @returns {Promise<object|null>} - Updated challenge record
   */
  markChallengeUsed: async (sessionToken) => {
    try {
      const query = `
        UPDATE mfa_challenges
        SET is_used = TRUE,
            updated_at = NOW()
        WHERE session_token = $1
          AND is_used = FALSE
        RETURNING id, user_id, session_token, is_used, updated_at;
      `;

      return await db.queryOne(query, [sessionToken]);
    } catch (error) {
      console.error('Mark MFA challenge used error:', error);
      throw error;
    }
  },

  /**
   * Increment the attempt count for an MFA challenge (for rate limiting)
   * @param {string} sessionToken - Session token of the challenge
   * @returns {Promise<object|null>} - Updated challenge record with new attempt count
   */
  incrementAttemptCount: async (sessionToken) => {
    try {
      const query = `
        UPDATE mfa_challenges
        SET attempt_count = attempt_count + 1,
            updated_at = NOW()
        WHERE session_token = $1
        RETURNING id, user_id, session_token, attempt_count, expires_at, is_used;
      `;

      return await db.queryOne(query, [sessionToken]);
    } catch (error) {
      console.error('Increment MFA attempt count error:', error);
      throw error;
    }
  },

  /**
   * Invalidate all active MFA challenges for a given user
   * Useful when a new challenge is issued or account is locked
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Result with count of invalidated challenges
   */
  invalidateUserChallenges: async (userId) => {
    try {
      const query = `
        UPDATE mfa_challenges
        SET is_used = TRUE,
            updated_at = NOW()
        WHERE user_id = $1
          AND is_used = FALSE
          AND expires_at > NOW()
        RETURNING id;
      `;

      const results = await db.query(query, [userId]);

      return {
        success: true,
        invalidatedCount: results ? results.length : 0,
      };
    } catch (error) {
      console.error('Invalidate user MFA challenges error:', error);
      throw error;
    }
  },

  /**
   * Delete all expired MFA challenge records to keep the table clean
   * @returns {Promise<object>} - Result with count of deleted records
   */
  deleteExpiredChallenges: async () => {
    try {
      const query = `
        DELETE FROM mfa_challenges
        WHERE expires_at <= NOW()
        RETURNING id;
      `;

      const results = await db.query(query, []);

      return {
        success: true,
        deletedCount: results ? results.length : 0,
      };
    } catch (error) {
      console.error('Delete expired MFA challenges error:', error);
      throw error;
    }
  },

  /**
   * Get all active challenges for a user (for diagnostics/admin)
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} - Array of active challenge records
   */
  getActiveChallengesForUser: async (userId) => {
    try {
      const query = `
        SELECT id, user_id, session_token, expires_at, is_used, attempt_count, created_at
        FROM mfa_challenges
        WHERE user_id = $1
          AND is_used = FALSE
          AND expires_at > NOW()
        ORDER BY created_at DESC;
      `;

      return await db.query(query, [userId]);
    } catch (error) {
      console.error('Get active MFA challenges error:', error);
      throw error;
    }
  },
};

module.exports = MFAModel;