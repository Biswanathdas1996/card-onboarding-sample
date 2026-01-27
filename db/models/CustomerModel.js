/**
 * Customer Model
 * Database operations for customer form submissions
 */

const db = require('../config');
const { v4: uuidv4 } = require('uuid');

const CustomerModel = {
  /**
   * Create a new customer record
   * @param {object} customerData - Customer form data
   * @returns {Promise<object>} - Created customer record
   */
  create: async (customerData) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        accountType,
        employmentStatus,
        annualIncome,
        dateOfBirth,
        nationality,
      } = customerData;

      const query = `
        INSERT INTO customer_forms (
          first_name, last_name, email, phone_number, account_type,
          employment_status, annual_income, date_of_birth, nationality
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        firstName,
        lastName,
        email,
        phoneNumber || null,
        accountType,
        employmentStatus || null,
        annualIncome || null,
        dateOfBirth || null,
        nationality || null,
      ]);

      return {
        success: true,
        customerId: result.id,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Customer creation error:', error);
      if (error.code === '23505') {
        // Unique constraint violation (email already exists)
        return {
          success: false,
          error: 'Email already registered',
          code: 'DUPLICATE_EMAIL',
        };
      }
      throw error;
    }
  },

  /**
   * Get customer by ID
   * @param {string} customerId - Customer UUID
   * @returns {Promise<object>} - Customer record
   */
  getById: async (customerId) => {
    try {
      const query = `
        SELECT id, first_name, last_name, email, phone_number, account_type,
               employment_status, annual_income, date_of_birth, nationality,
               status, created_at, updated_at
        FROM customer_forms
        WHERE id = $1;
      `;

      return await db.queryOne(query, [customerId]);
    } catch (error) {
      console.error('Get customer error:', error);
      throw error;
    }
  },

  /**
   * Get customer by email
   * @param {string} email - Customer email
   * @returns {Promise<object>} - Customer record
   */
  getByEmail: async (email) => {
    try {
      const query = `
        SELECT id, first_name, last_name, email, phone_number, account_type,
               employment_status, annual_income, date_of_birth, nationality,
               status, created_at, updated_at
        FROM customer_forms
        WHERE email = $1;
      `;

      return await db.queryOne(query, [email]);
    } catch (error) {
      console.error('Get customer by email error:', error);
      throw error;
    }
  },

  /**
   * Update customer status
   * @param {string} customerId - Customer UUID
   * @param {string} status - New status (pending, approved, rejected)
   * @returns {Promise<object>} - Updated customer record
   */
  updateStatus: async (customerId, status) => {
    try {
      const query = `
        UPDATE customer_forms
        SET status = $1
        WHERE id = $2
        RETURNING id, status, updated_at;
      `;

      return await db.queryOne(query, [status, customerId]);
    } catch (error) {
      console.error('Update customer status error:', error);
      throw error;
    }
  },

  /**
   * Get all customers (paginated)
   * @param {number} limit - Number of records per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<array>} - Array of customer records
   */
  getAll: async (limit = 20, offset = 0) => {
    try {
      const query = `
        SELECT id, first_name, last_name, email, phone_number, account_type,
               status, created_at, updated_at
        FROM customer_forms
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      return await db.queryAll(query, [limit, offset]);
    } catch (error) {
      console.error('Get all customers error:', error);
      throw error;
    }
  },

  /**
   * Count total customers
   * @returns {Promise<number>} - Total customer count
   */
  count: async () => {
    try {
      const query = `SELECT COUNT(*) as count FROM customer_forms;`;
      const result = await db.queryOne(query);
      return parseInt(result.count, 10);
    } catch (error) {
      console.error('Count customers error:', error);
      throw error;
    }
  },

  /**
   * Delete customer (soft delete via status)
   * @param {string} customerId - Customer UUID
   * @returns {Promise<object>} - Result of deletion
   */
  delete: async (customerId) => {
    try {
      const query = `
        DELETE FROM customer_forms
        WHERE id = $1
        RETURNING id;
      `;

      const result = await db.queryOne(query, [customerId]);
      return { success: !!result };
    } catch (error) {
      console.error('Delete customer error:', error);
      throw error;
    }
  },
};

module.exports = CustomerModel;
