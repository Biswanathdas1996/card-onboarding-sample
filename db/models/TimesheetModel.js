/**
 * Timesheet Model
 * Database operations for employee timesheets
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
        employeeId,
        date,
        hoursWorked,
        projectCode,
        notes,
      } = timesheetData;

      const query = `
        INSERT INTO timesheets (
          employee_id,
          date,
          hours_worked,
          project_code,
          notes
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        employeeId,
        date,
        hoursWorked,
        projectCode || null,
        notes || null,
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
   * Get timesheet by ID
   * @param {string} timesheetId - Timesheet UUID
   * @returns {Promise<object>} - Timesheet record
   */
  getById: async (timesheetId) => {
    try {
      const query = `
        SELECT id, employee_id, date, hours_worked, project_code, notes, created_at, updated_at
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
   * Get timesheets by employee ID
   * @param {string} employeeId - Employee UUID
   * @returns {Promise<object[]>} - Array of timesheet records
   */
  getByEmployeeId: async (employeeId) => {
    try {
      const query = `
        SELECT id, employee_id, date, hours_worked, project_code, notes, created_at, updated_at
        FROM timesheets
        WHERE employee_id = $1;
      `;

      return await db.query(query, [employeeId]);
    } catch (error) {
      console.error('Get timesheets by employee ID error:', error);
      throw error;
    }
  },

  /**
   * Update timesheet information
   * @param {string} timesheetId - Timesheet UUID
   * @param {object} updateData - Timesheet data to update
   * @returns {Promise<object>} - Updated timesheet record
   */
  update: async (timesheetId, updateData) => {
    try {
      const {
        date,
        hoursWorked,
        projectCode,
        notes,
      } = updateData;

      let query = `
        UPDATE timesheets
        SET date = $1,
            hours_worked = $2,
            project_code = $3,
            notes = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, employee_id, date, hours_worked, project_code, notes, created_at, updated_at;
      `;

      const result = await db.queryOne(query, [
        date,
        hoursWorked,
        projectCode || null,
        notes || null,
        timesheetId
      ]);

      return result;
    } catch (error) {
      console.error('Update timesheet error:', error);
      throw error;
    }
  },

  /**
   * Delete timesheet by ID
   * @param {string} timesheetId - Timesheet UUID
   * @returns {Promise<void>}
   */
  delete: async (timesheetId) => {
    try {
      const query = `
        DELETE FROM timesheets
        WHERE id = $1;
      `;

      await db.query(query, [timesheetId]);
    } catch (error) {
      console.error('Delete timesheet error:', error);
      throw error;
    }
  },
};

module.exports = TimesheetModel;