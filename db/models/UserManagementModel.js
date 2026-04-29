/**
 * User Management Model
 * CRUD operations for user management table
 */

const pool = require('../config');

const UserManagementModel = {
  /**
   * Create a new user record
   * @param {Object} userData - User data { name, dateOfBirth, address }
   * @returns {Object} Result with success status and user ID
   */
  async create(userData) {
    const { name, dateOfBirth, address } = userData;

    try {
      const query = `
        INSERT INTO user_management (name, date_of_birth, address)
        VALUES ($1, $2, $3)
        RETURNING id, name, date_of_birth, address, created_at, updated_at
      `;

      const values = [name, dateOfBirth, address];
      const result = await pool.query(query, values);

      return {
        success: true,
        user: result.rows[0]
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  },

  /**
   * Get all users with pagination
   * @param {number} limit - Number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Array} Array of user records
   */
  async getAll(limit = 20, offset = 0) {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at, updated_at
        FROM user_management
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {string} userId - User UUID
   * @returns {Object|null} User record or null if not found
   */
  async getById(userId) {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at, updated_at
        FROM user_management
        WHERE id = $1
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },

  /**
   * Update user record
   * @param {string} userId - User UUID
   * @param {Object} userData - Updated user data
   * @returns {Object|null} Updated user record or null if not found
   */
  async update(userId, userData) {
    const { name, dateOfBirth, address } = userData;

    try {
      const query = `
        UPDATE user_management
        SET name = $1, date_of_birth = $2, address = $3
        WHERE id = $4
        RETURNING id, name, date_of_birth, address, created_at, updated_at
      `;

      const values = [name, dateOfBirth, address, userId];
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Delete user by ID
   * @param {string} userId - User UUID
   * @returns {boolean} True if deleted, false otherwise
   */
  async delete(userId) {
    try {
      const query = 'DELETE FROM user_management WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [userId]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Get total count of users
   * @returns {number} Total number of users
   */
  async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM user_management');
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }
};

module.exports = UserManagementModel;
