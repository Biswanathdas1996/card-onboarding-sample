/**
 * User Model
 * Database operations for user management
 */

const db = require('../config');

const UserModel = {
  /**
   * Create a new user record
   * @param {object} userData - User data
   * @returns {Promise<object>} - Created user record
   */
  create: async (userData) => {
    try {
      const { name, dateOfBirth, address } = userData;

      const query = `
        INSERT INTO user_management (name, date_of_birth, address)
        VALUES ($1, $2, $3)
        RETURNING id, name, date_of_birth, address, created_at;
      `;

      const result = await db.queryOne(query, [name, dateOfBirth, address]);

      return {
        success: true,
        userId: result.id,
        data: {
          id: result.id,
          name: result.name,
          dateOfBirth: result.date_of_birth,
          address: result.address,
          createdAt: result.created_at
        }
      };
    } catch (error) {
      console.error('User creation error:', error);
      return {
        success: false,
        error: 'Failed to create user',
        message: error.message
      };
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
        SELECT id, name, date_of_birth, address, created_at, updated_at
        FROM user_management
        WHERE id = $1;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  /**
   * Get all users (paginated)
   * @param {number} limit - Number of records per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<array>} - Array of user records
   */
  getAll: async (limit = 100, offset = 0) => {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at, updated_at
        FROM user_management
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      return await db.queryAll(query, [limit, offset]);
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  },

  /**
   * Update user
   * @param {string} userId - User UUID
   * @param {object} userData - Updated user data
   * @returns {Promise<object>} - Updated user record
   */
  update: async (userId, userData) => {
    try {
      const { name, dateOfBirth, address } = userData;

      const query = `
        UPDATE user_management
        SET name = $1, date_of_birth = $2, address = $3
        WHERE id = $4
        RETURNING id, name, date_of_birth, address, updated_at;
      `;

      return await db.queryOne(query, [name, dateOfBirth, address, userId]);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {string} userId - User UUID
   * @returns {Promise<object>} - Result of deletion
   */
  delete: async (userId) => {
    try {
      const query = `
        DELETE FROM user_management
        WHERE id = $1
        RETURNING id;
      `;

      const result = await db.queryOne(query, [userId]);
      return { success: !!result };
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  /**
   * Count total users
   * @returns {Promise<number>} - Total user count
   */
  count: async () => {
    try {
      const query = `SELECT COUNT(*) as count FROM user_management;`;
      const result = await db.queryOne(query);
      return parseInt(result.count, 10);
    } catch (error) {
      console.error('Count users error:', error);
      throw error;
    }
  }
};

module.exports = UserModel;
