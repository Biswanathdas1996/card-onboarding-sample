/**
 * Basic Details Model
 * Database operations for basic user details (name, DOB, address)
 */

const db = require('../config');

const BasicDetailsModel = {
  /**
   * Create a new basic details record
   * @param {object} userData - User basic details
   * @returns {Promise<object>} - Created user record
   */
  create: async (userData) => {
    try {
      const { name, dateOfBirth, address } = userData;

      const query = `
        INSERT INTO basic_details (name, date_of_birth, address)
        VALUES ($1, $2, $3)
        RETURNING id, name, date_of_birth, address, created_at;
      `;

      const result = await db.queryOne(query, [name, dateOfBirth, address]);

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          dateOfBirth: result.date_of_birth,
          address: result.address,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      console.error('Basic details creation error:', error);
      if (error.code === '42P01') {
        // Table doesn't exist
        return {
          success: false,
          error: 'Database table not initialized. Please run database migrations.',
          code: 'TABLE_NOT_FOUND',
        };
      }
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<object>} - User record
   */
  getById: async (userId) => {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at
        FROM basic_details
        WHERE id = $1;
      `;

      return await db.queryOne(query, [userId]);
    } catch (error) {
      console.error('Get user error:', error);
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
        SELECT id, name, date_of_birth, address, created_at
        FROM basic_details
        ORDER BY created_at DESC;
      `;

      return await db.queryAll(query);
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  },

  /**
   * Count total users
   * @returns {Promise<number>} - Total user count
   */
  count: async () => {
    try {
      const query = `SELECT COUNT(*) as count FROM basic_details;`;
      const result = await db.queryOne(query);
      return parseInt(result.count, 10);
    } catch (error) {
      console.error('Count users error:', error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {Promise<object>} - Result of deletion
   */
  delete: async (userId) => {
    try {
      const query = `
        DELETE FROM basic_details
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
};

module.exports = BasicDetailsModel;
