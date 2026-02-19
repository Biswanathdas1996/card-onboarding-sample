/**
 * Employee Model
 * Database operations for employee records
 */

const db = require('../config');

const EmployeeModel = {
  /**
   * Create a new employee record
   * @param {object} employeeData - Employee data
   * @returns {Promise<object>} - Created employee record
   */
  create: async (employeeData) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        payRate,
        bankName,
        bankAccountNumber,
        taxInformation,
      } = employeeData;

      const query = `
        INSERT INTO employees (
          first_name, last_name, email, phone_number, pay_rate,
          bank_name, bank_account_number, tax_information
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        firstName,
        lastName,
        email,
        phoneNumber || null,
        payRate,
        bankName || null,
        bankAccountNumber || null,
        taxInformation || null,
      ]);

      return {
        success: true,
        employeeId: result.id,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Employee creation error:', error);
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
   * Get employee by ID
   * @param {string} employeeId - Employee UUID
   * @returns {Promise<object>} - Employee record
   */
  getById: async (employeeId) => {
    try {
      const query = `
        SELECT id, first_name, last_name, email, phone_number, pay_rate,
               bank_name, bank_account_number, tax_information, created_at, updated_at
        FROM employees
        WHERE id = $1;
      `;

      return await db.queryOne(query, [employeeId]);
    } catch (error) {
      console.error('Get employee error:', error);
      throw error;
    }
  },

  /**
   * Get employee by email
   * @param {string} email - Employee email
   * @returns {Promise<object>} - Employee record
   */
  getByEmail: async (email) => {
    try {
      const query = `
        SELECT id, first_name, last_name, email, phone_number, pay_rate,
               bank_name, bank_account_number, tax_information, created_at, updated_at
        FROM employees
        WHERE email = $1;
      `;

      return await db.queryOne(query, [email]);
    } catch (error) {
      console.error('Get employee by email error:', error);
      throw error;
    }
  },

  /**
   * Update employee information
   * @param {string} employeeId - Employee UUID
   * @param {object} updateData - Employee data to update
   * @returns {Promise<object>} - Updated employee record
   */
  update: async (employeeId, updateData) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        payRate,
        bankName,
        bankAccountNumber,
        taxInformation,
      } = updateData;

      const query = `
        UPDATE employees
        SET
          first_name = $1,
          last_name = $2,
          email = $3,
          phone_number = $4,
          pay_rate = $5,
          bank_name = $6,
          bank_account_number = $7,
          tax_information = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING id, updated_at;
      `;

      const result = await db.queryOne(query, [
        firstName,
        lastName,
        email,
        phoneNumber || null,
        payRate,
        bankName || null,
        bankAccountNumber || null,
        taxInformation || null,
        employeeId,
      ]);

      return {
        success: true,
        employeeId: result.id,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error('Employee update error:', error);
      throw error;
    }
  },

  /**
   * Delete employee by ID
   * @param {string} employeeId - Employee UUID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  delete: async (employeeId) => {
    try {
      const query = `
        DELETE FROM employees
        WHERE id = $1;
      `;

      await db.query(query, [employeeId]);
      return true;
    } catch (error) {
      console.error('Employee deletion error:', error);
      return false;
    }
  },
};

module.exports = EmployeeModel;