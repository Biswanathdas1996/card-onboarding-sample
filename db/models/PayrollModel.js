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
        customerId,
        payPeriodStart,
        payPeriodEnd,
        grossPay,
        totalDeductions,
        netPay,
        paymentDate,
      } = payrollData;

      const query = `
        INSERT INTO payroll_records (
          customer_id, pay_period_start, pay_period_end, gross_pay,
          total_deductions, net_pay, payment_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        customerId,
        payPeriodStart,
        payPeriodEnd,
        grossPay || null,
        totalDeductions || null,
        netPay || null,
        paymentDate || null,
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
        SELECT id, customer_id, pay_period_start, pay_period_end, gross_pay,
               total_deductions, net_pay, payment_date, created_at, updated_at
        FROM payroll_records
        WHERE id = $1;
      `;

      return await db.queryOne(query, [payrollId]);
    } catch (error) {
      console.error('Get payroll error:', error);
      throw error;
    }
  },

  /**
   * Get payroll records by customer ID
   * @param {string} customerId - Customer UUID
   * @returns {Promise<object[]>} - Array of payroll records
   */
  getByCustomerId: async (customerId) => {
    try {
      const query = `
        SELECT id, customer_id, pay_period_start, pay_period_end, gross_pay,
               total_deductions, net_pay, payment_date, created_at, updated_at
        FROM payroll_records
        WHERE customer_id = $1;
      `;

      return await db.query(query, [customerId]);
    } catch (error) {
      console.error('Get payrolls by customer ID error:', error);
      throw error;
    }
  },

  /**
   * Update payroll record
   * @param {string} payrollId - Payroll UUID
   * @param {object} payrollData - Payroll data to update
   * @returns {Promise<object>} - Updated payroll record
   */
  update: async (payrollId, payrollData) => {
    try {
      const {
        payPeriodStart,
        payPeriodEnd,
        grossPay,
        totalDeductions,
        netPay,
        paymentDate,
      } = payrollData;

      const query = `
        UPDATE payroll_records
        SET pay_period_start = $1,
            pay_period_end = $2,
            gross_pay = $3,
            total_deductions = $4,
            net_pay = $5,
            payment_date = $6,
            updated_at = NOW()
        WHERE id = $7
        RETURNING id, customer_id, pay_period_start, pay_period_end, gross_pay,
        total_deductions, net_pay, payment_date, created_at, updated_at;
      `;

      const result = await db.queryOne(query, [
        payPeriodStart,
        payPeriodEnd,
        grossPay || null,
        totalDeductions || null,
        netPay || null,
        paymentDate || null,
        payrollId,
      ]);

      return result;
    } catch (error) {
      console.error('Update payroll error:', error);
      throw error;
    }
  },
};

module.exports = PayrollModel;