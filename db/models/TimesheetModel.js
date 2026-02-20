/**
 * Timesheet Model
 * Database operations for timesheet submissions
 */

const db = require('../config');

const TimesheetModel = {
  /**
   * Create a new timesheet record
   * @param {object} timesheetData - Timesheet data
   * @returns {Promise<object>} - Created timesheet record
   */
  create: async (timesheetData) => {
    try {
      const {
        customerId,
        startTime,
        endTime,
        totalHours,
        date,
      } = timesheetData;

      const query = `
        INSERT INTO timesheets (
          customer_id, start_time, end_time, total_hours, date
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        customerId,
        startTime,
        endTime,
        totalHours || null,
        date,
      ]);

      return {
        success: true,
        timesheetId: result.id,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Timesheet creation error:', error);
      throw error;
    }
  },

  /**
   * Get timesheet record by ID
   * @param {string} timesheetId - Timesheet UUID
   * @returns {Promise<object>} - Timesheet record
   */
  getById: async (timesheetId) => {
    try {
      const query = `
        SELECT id, customer_id, start_time, end_time, total_hours, date, created_at, updated_at
        FROM timesheets
        WHERE id = $1;
      `;

      return await db.queryOne(query, [timesheetId]);
    } catch (error) {
      console.error('Get timesheet error:', error);
      throw error;
    }
  },

  /**
   * Get timesheet records by customer ID
   * @param {string} customerId - Customer UUID
   * @returns {Promise<object[]>} - Array of timesheet records
   */
  getByCustomerId: async (customerId) => {
    try {
      const query = `
        SELECT id, customer_id, start_time, end_time, total_hours, date, created_at, updated_at
        FROM timesheets
        WHERE customer_id = $1;
      `;

      return await db.query(query, [customerId]);
    } catch (error) {
      console.error('Get timesheets by customer ID error:', error);
      throw error;
    }
  },

  /**
   * Update timesheet record
   * @param {string} timesheetId - Timesheet UUID
   * @param {object} timesheetData - Timesheet data to update
   * @returns {Promise<object>} - Updated timesheet record
   */
  update: async (timesheetId, timesheetData) => {
    try {
      const {
        startTime,
        endTime,
        totalHours,
        date,
      } = timesheetData;

      const query = `
        UPDATE timesheets
        SET start_time = $1,
            end_time = $2,
            total_hours = $3,
            date = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, customer_id, start_time, end_time, total_hours, date, created_at, updated_at;
      `;

      const result = await db.queryOne(query, [
        startTime,
        endTime,
        totalHours,
        date,
        timesheetId,
      ]);

      return result;
    } catch (error) {
      console.error('Update timesheet error:', error);
      throw error;
    }
  },
};

module.exports = TimesheetModel;