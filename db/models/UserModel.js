/**
 * User Model
 * Database operations for the users table
 */

const db = require('../config');

const UserModel = {
  /**
   * Get user by email (case-insensitive normalized lookup)
   * @param {string} email - User email address
   * @returns {Promise<object>} - User record
   */
  getUserByEmail: async (email) => {
    try {
      const query = `
        SELECT id, email, password_hash, role, failed_login_attempts,
               locked_until, is_active, created_at, updated_at
        FROM users
        WHERE LOWER(email) = LOWER($1);
      `;

      return await db.queryOne(query, [email.trim()]);
    } catch (error) {
      console.error('Get user by email error:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - User record
   */
  getById: async (userId) => {
    try {
      const query = `
        SELECT id, email, password_hash, role, failed_login_attempts,
               locked_until, is_active, created_at, updated_at
        FROM users
        WHERE id = $1;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  },

  /**
   * Increment failed login attempts counter for a user
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Updated user record with new failed_login_attempts count
   */
  incrementFailedAttempts: async (userId) => {
    try {
      const query = `
        UPDATE users
        SET failed_login_attempts = failed_login_attempts + 1,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, failed_login_attempts, locked_until, is_active;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Increment failed attempts error:', error);
      throw error;
    }
  },

  /**
   * Reset failed login attempts counter to zero on successful login
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Updated user record
   */
  resetFailedAttempts: async (userId) => {
    try {
      const query = `
        UPDATE users
        SET failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, failed_login_attempts, locked_until;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Reset failed attempts error:', error);
      throw error;
    }
  },

  /**
   * Lock a user account for a specified duration
   * @param {string} userId - User UUID
   * @param {number} lockDurationMinutes - Duration in minutes to lock the account (default: 30)
   * @returns {Promise<object>} - Updated user record with locked_until timestamp
   */
  lockAccount: async (userId, lockDurationMinutes = 30) => {
    try {
      const query = `
        UPDATE users
        SET locked_until = NOW() + ($2 || ' minutes')::INTERVAL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, failed_login_attempts, locked_until;
      `;

      return await db.queryOne(query, [userId, lockDurationMinutes]);
    } catch (error) {
      console.error('Lock account error:', error);
      throw error;
    }
  },

  /**
   * Check whether a user account is currently locked
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Object with isLocked boolean and lockedUntil timestamp
   */
  isAccountLocked: async (userId) => {
    try {
      const query = `
        SELECT id, email, locked_until,
               (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
        FROM users
        WHERE id = $1;
      `;

      const result = await db.queryOne(query, [userId]);

      if (!result) {
        return { isLocked: false, lockedUntil: null };
      }

      return {
        isLocked: result.is_locked === true,
        lockedUntil: result.locked_until || null,
      };
    } catch (error) {
      console.error('Is account locked error:', error);
      throw error;
    }
  },

  /**
   * Update the last login timestamp for a user
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Updated user record
   */
  updateLastLogin: async (userId) => {
    try {
      const query = `
        UPDATE users
        SET last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, last_login_at;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Update last login error:', error);
      throw error;
    }
  },
};

module.exports = UserModel;