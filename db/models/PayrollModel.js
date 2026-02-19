/**
 * Payroll Model
 * Database operations for payroll records
 */

const db = require('../config');

const PayrollModel = {
  /**
   * Create a new payroll record
   * @param {object} payrollData - Payroll data
   * @returns {Promise<object>} - Created payroll record
   */
  create: async (payrollData) => {
    try {
      const {
        employeeId,
        payPeriodStart,
        payPeriodEnd,
        grossPay,
        deductions,
        netPay,
        timesheetData,
      } = payrollData;

      const query = `
        INSERT INTO payroll (
          employee_id,
          pay_period_start,
          pay_period_end,
          gross_pay,
          deductions,
          net_pay,
          timesheet_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        employeeId,
        payPeriodStart,
        payPeriodEnd,
        grossPay,
        deductions,
        netPay,
        JSON.stringify(timesheetData), // Store timesheet data as JSON
      ]);

      return {
        success: true,
        payrollId: result.id,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Payroll creation error:', error);
      throw error;
    }
  },

  /**
   * Get payroll record by ID
   * @param {string} payrollId - Payroll UUID
   * @returns {Promise<object>} - Payroll record
   */
  getById: async (payrollId) => {
    try {
      const query = `
        SELECT id, employee_id, pay_period_start, pay_period_end,
               gross_pay, deductions, net_pay, timesheet_data, created_at, updated_at
        FROM payroll
        WHERE id = $1;
      `;

      const result = await db.queryOne(query, [payrollId]);
      // Parse timesheet_data from JSON
      if (result && result.timesheet_data) {
        result.timesheet_data = JSON.parse(result.timesheet_data);
      }
      return result;
    } catch (error) {
      console.error('Get payroll error:', error);
      throw error;
    }
  },

  /**
   * Get payroll records by employee ID
   * @param {string} employeeId - Employee UUID
   * @returns {Promise<object[]>} - Array of payroll records
   */
  getByEmployeeId: async (employeeId) => {
    try {
      const query = `
        SELECT id, employee_id, pay_period_start, pay_period_end,
               gross_pay, deductions, net_pay, timesheet_data, created_at, updated_at
        FROM payroll
        WHERE employee_id = $1;
      `;

      const results = await db.query(query, [employeeId]);
      // Parse timesheet_data from JSON for each record
      results.forEach(result => {
        if (result.timesheet_data) {
          result.timesheet_data = JSON.parse(result.timesheet_data);
        }
      });
      return results;
    } catch (error) {
      console.error('Get payroll by employee error:', error);
      throw error;
    }
  },
};

module.exports = PayrollModel;