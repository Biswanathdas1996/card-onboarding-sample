/**
 * Basic Details Model
 * Database operations for basic details submissions
 */

const db = require('../config');
const { v4: uuidv4 } = require('uuid');

const BasicDetailsModel = {
  /**
   * Create a new basic details record
   * @param {object} basicData - Basic details data
   * @returns {Promise<object>} - Created record
   */
  create: async (basicData) => {
    try {
      const {
        name,
        dateOfBirth,
        address,
      } = basicData;

      const query = `
        INSERT INTO basic_details (
          name, date_of_birth, address
        )
        VALUES ($1, $2, $3)
        RETURNING id, name, date_of_birth, address, created_at;
      `;

      const result = await db.queryOne(query, [
        name,
        dateOfBirth,
        address,
      ]);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Basic details creation error:', error);
      throw error;
    }
  },

  /**
   * Get basic details by ID
   * @param {string} id - Record UUID
   * @returns {Promise<object>} - Basic details record
   */
  getById: async (id) => {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at
        FROM basic_details
        WHERE id = $1;
      `;

      return await db.queryOne(query, [id]);
    } catch (error) {
      console.error('Get basic details error:', error);
      throw error;
    }
  },

  /**
   * Get all basic details (paginated)
   * @param {number} limit - Number of records per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<array>} - Array of basic details records
   */
  getAll: async (limit = 100, offset = 0) => {
    try {
      const query = `
        SELECT id, name, date_of_birth, address, created_at
        FROM basic_details
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      return await db.queryAll(query, [limit, offset]);
    } catch (error) {
      console.error('Get all basic details error:', error);
      throw error;
    }
  },

  /**
   * Count total records
   * @returns {Promise<number>} - Total record count
   */
  count: async () => {
    try {
      const query = `SELECT COUNT(*) as count FROM basic_details;`;
      const result = await db.queryOne(query);
      return parseInt(result.count, 10);
    } catch (error) {
      console.error('Count basic details error:', error);
      throw error;
    }
  },

  /**
   * Delete basic details record
   * @param {string} id - Record UUID
   * @returns {Promise<object>} - Result of deletion
   */
  delete: async (id) => {
    try {
      const query = `
        DELETE FROM basic_details
        WHERE id = $1
        RETURNING id;
      `;

      const result = await db.queryOne(query, [id]);
      return { success: !!result };
    } catch (error) {
      console.error('Delete basic details error:', error);
      throw error;
    }
  },
};

module.exports = BasicDetailsModel;
