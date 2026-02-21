/**
 * Password Reset Model
 * Database operations for password_resets table
 */

const db = require('../config');
const crypto = require('crypto');

/**
 * Generate a cryptographically secure reset token
 * @returns {string} - Hex-encoded random reset token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const PasswordResetModel = {
  /**
   * Create a new password reset token for a user
   * @param {string} userId - User UUID
   * @param {number} expiryMinutes - Minutes until the token expires (default: 30)
   * @returns {Promise<object>} - Created reset token record
   */
  createResetToken: async (userId, expiryMinutes = 30) => {
    try {
      const token = generateResetToken();

      const query = `
        INSERT INTO password_resets (
          user_id, token, expires_at, is_used
        )
        VALUES ($1, $2, NOW() + ($3 || ' minutes')::INTERVAL, FALSE)
        RETURNING id, user_id, token, expires_at, created_at;
      `;

      const result = await db.queryOne(query, [
        userId,
        token,
        String(expiryMinutes),
      ]);

      return {
        success: true,
        resetId: result.id,
        userId: result.user_id,
        token: result.token,
        expiresAt: result.expires_at,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Password reset token creation error:', error);
      throw error;
    }
  },

  /**
   * Retrieve an active (non-expired, non-used) reset token record
   * @param {string} token - Reset token string
   * @returns {Promise<object|null>} - Active reset token record or null if not found
   */
  getByToken: async (token) => {
    try {
      const query = `
        SELECT id, user_id, token, expires_at, is_used, created_at
        FROM password_resets
        WHERE token = $1
          AND is_used = FALSE
          AND expires_at > NOW();
      `;

      return await db.queryOne(query, [token]);
    } catch (error) {
      console.error('Get password reset token error:', error);
      throw error;
    }
  },

  /**
   * Mark a reset token as used so it cannot be reused
   * @param {string} token - Reset token string
   * @returns {Promise<object>} - Result of the update operation
   */
  markTokenUsed: async (token) => {
    try {
      const query = `
        UPDATE password_resets
        SET is_used = TRUE, used_at = NOW()
        WHERE token = $1
          AND is_used = FALSE
        RETURNING id, user_id, token, is_used, used_at;
      `;

      const result = await db.queryOne(query, [token]);

      if (!result) {
        return {
          success: false,
          error: 'Token not found or already used',
          code: 'TOKEN_NOT_FOUND',
        };
      }

      return {
        success: true,
        resetId: result.id,
        userId: result.user_id,
        token: result.token,
        isUsed: result.is_used,
        usedAt: result.used_at,
      };
    } catch (error) {
      console.error('Mark password reset token used error:', error);
      throw error;
    }
  },

  /**
   * Delete all expired password reset tokens to keep the table clean
   * @returns {Promise<object>} - Result including count of deleted records
   */
  deleteExpiredTokens: async () => {
    try {
      const query = `
        DELETE FROM password_resets
        WHERE expires_at <= NOW()
        RETURNING id;
      `;

      const results = await db.query(query, []);

      return {
        success: true,
        deletedCount: results ? results.length : 0,
      };
    } catch (error) {
      console.error('Delete expired password reset tokens error:', error);
      throw error;
    }
  },

  /**
   * Invalidate all active reset tokens for a given user
   * Useful when a password is successfully reset or account is locked
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Result including count of invalidated records
   */
  invalidateAllForUser: async (userId) => {
    try {
      const query = `
        UPDATE password_resets
        SET is_used = TRUE, used_at = NOW()
        WHERE user_id = $1
          AND is_used = FALSE
        RETURNING id;
      `;

      const results = await db.query(query, [userId]);

      return {
        success: true,
        invalidatedCount: results ? results.length : 0,
      };
    } catch (error) {
      console.error('Invalidate password reset tokens error:', error);
      throw error;
    }
  },
};

module.exports = PasswordResetModel;