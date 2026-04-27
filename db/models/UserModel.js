/**
 * User Model
 * Database operations for user management
 */

const db = require('../config');
const { v4: uuidv4 } = require('uuid');

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
        INSERT INTO users (name, date_of_birth, address)
        VALUES ($1, $2, $3)
        RETURNING id, name, date_of_birth, address, created_at;
      `;

      const result = await db.queryOne(query, [name, dateOfBirth, address]);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  },

  /**
   * Get all users
   * @returns {Promise<array>} - Array of user records
   */
  getAll: async () => {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at, updated_at
        FROM users
        ORDER BY created_at DESC;
      `;

      return await db.queryAll(query);
    } catch (error) {
      console.error('Get all users error:', error);
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
        SELECT id, name, date_of_birth, address, created_at, updated_at
        FROM users
        WHERE id = $1;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Get user error:', error);
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
        DELETE FROM users
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
      const query = `SELECT COUNT(*) as count FROM users;`;
      const result = await db.queryOne(query);
      return parseInt(result.count, 10);
    } catch (error) {
      console.error('Count users error:', error);
      throw error;
    }
  },
};

module.exports = UserModel;
