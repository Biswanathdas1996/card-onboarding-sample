/**
 * Payroll API Service
 * Handles API endpoints for initiating payroll, calculating pay, and generating payslips
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Simulated network delay
 */
const simulateNetworkDelay = (ms = 400) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const PayrollService = {
  /**
   * Initiates payroll processing workflow for a given customer (employee)
   * @param {object} customerData - Customer data from KYC
   * @returns {Promise<object>} - API response
   */
  initiatePayroll: async (customerData) => {
    try {
      await simulateNetworkDelay(250);

      if (!customerData || typeof customerData !== 'object') {
        return {
          success: false,
          status: 400,
          message: 'Invalid customer data provided',
          timestamp: new Date().toISOString()
        };
      }

      // Basic data validation (expand as needed)
      const requiredFields = ['govID', 'pan', 'aadhaarNumber'];
      const missingFields = requiredFields.filter((field) => !customerData[field]);

      if (missingFields.length > 0) {
        return {
          success: false,
          status: 400,
          message: `Missing required customer fields: ${missingFields.join(', ')}`,
          timestamp: new Date().toISOString()
        };
      }

      // Create a payroll record (in-memory for now)
      const payrollRecord = {
        payrollId: uuidv4(),
        customerId: customerData.customerId || uuidv4(), // Assuming customerId exists or generate a new one
        employeeName: customerData.employeeName || 'N/A', // Example: Assuming employeeName exists
        pan: customerData.pan,
        aadhaarNumber: customerData.aadhaarNumber,
        govID: customerData.govID,
        status: 'Timesheet Data Collection', // Initial status
        initiationDate: new Date().toISOString(),
        timesheets: [], // Array to hold timesheet data
        paySlips: []
      };

      // In a real application, you would save this to a database
      // For now, we'll just log it
      console.log('Payroll record created:', payrollRecord);

      return {
        success: true,
        status: 201,
        message: 'Payroll processing initiated successfully',
        data: payrollRecord,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error initiating payroll:', error);
      return {
        success: false,
        status: 500,
        message: 'Failed to initiate payroll processing',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Collects employee timesheet data
   * @param {string} payrollId - Payroll ID
   * @param {object} timesheetData - Timesheet data
   * @returns {Promise<object>} - API response
   */
  submitTimesheetData: async (payrollId, timesheetData) => {
    try {
      await simulateNetworkDelay(200);

      if (!payrollId) {
        return {
          success: false,
          status: 400,
          message: 'Payroll ID is required',
          timestamp: new Date().toISOString()
        };
      }

      if (!timesheetData || typeof timesheetData !== 'object') {
        return {
          success: false,
          status: 400,
          message: 'Invalid timesheet data provided',
          timestamp: new Date().toISOString()
        };
      }

      // Timesheet data validation (example)
      const requiredFields = ['startTime', 'endTime', 'totalHours', 'date'];
      const missingFields = requiredFields.filter((field) => !timesheetData[field]);

      if (missingFields.length > 0) {
        return {
          success: false,
          status: 400,
          message: `Missing required timesheet fields: ${missingFields.join(', ')}`,
          timestamp: new Date().toISOString()
        };
      }

      // In a real application, you would retrieve the payroll record from the database
      // and update it with the timesheet data.
      // For now, we'll simulate this.
      const payrollRecord = { payrollId }; // Placeholder

      // Simulate saving timesheet data
      payrollRecord.timesheets = payrollRecord.timesheets || [];
      payrollRecord.timesheets.push(timesheetData);

      return {
        success: true,
        status: 200,
        message: 'Timesheet data submitted successfully',
        data: payrollRecord,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error submitting timesheet data:', error);
      return {
        success: false,
        status: 500,
        message: 'Failed to submit timesheet data',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Calculates gross pay based on timesheet data and pay rate
   * @param {string} payrollId - Payroll ID
   * @returns {Promise<object>} - API response
   */
  calculateGrossPay: async (payrollId) => {
    try {
      await simulateNetworkDelay(300);

      if (!payrollId) {
        return {
          success: false,
          status: 400,
          message: 'Payroll ID is required',
          timestamp: new Date().toISOString()
        };
      }

      // In a real application, you would retrieve the payroll record from the database
      // and calculate the gross pay based on the timesheet data and pay rate.
      // For now, we'll simulate this.
      const payrollRecord = { payrollId, timesheets: [{ totalHours: 40 }] }; // Placeholder

      // Simulate gross pay calculation
      const hourlyRate = 20; // Example hourly rate
      const totalHours = payrollRecord.timesheets.reduce((sum, timesheet) => sum + timesheet.totalHours, 0);
      const grossPay = totalHours * hourlyRate;

      return {
        success: true,
        status: 200,
        message: 'Gross pay calculated successfully',
        data: { payrollId: payrollId, grossPay: grossPay },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error calculating gross pay:', error);
      return {
        success: false,
        status: 500,
        message: 'Failed to calculate gross pay',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Generates payslips for employees, detailing gross pay, deductions, and net pay.
   * @param {string} payrollId - Payroll ID
   * @returns {Promise<object>} - API response
   */
  generatePaySlip: async (payrollId) => {
    try {
      await simulateNetworkDelay(300);

      if (!payrollId) {
        return {
          success: false,
          status: 400,
          message: 'Payroll ID is required',
          timestamp: new Date().toISOString()
        };
      }

      // In a real application, you would retrieve the payroll record from the database
      // and generate the payslip.
      // For now, we'll simulate this.
      const payrollRecord = { payrollId, grossPay: 800, employeeName: 'John Doe' }; // Placeholder

      // Simulate payslip generation
      const federalTax = payrollRecord.grossPay * 0.2;
      const stateTax = payrollRecord.grossPay * 0.05;
      const netPay = payrollRecord.grossPay - federalTax - stateTax;

      const paySlip = {
        paySlipId: uuidv4(),
        employeeName: payrollRecord.employeeName,
        payrollId: payrollRecord.payrollId,
        payPeriodStart: new Date().toISOString(),
        payPeriodEnd: new Date().toISOString(),
        grossPay: payrollRecord.grossPay,
        federalTax: federalTax,
        stateTax: stateTax,
        netPay: netPay
      };

      return {
        success: true,
        status: 200,
        message: 'Payslip generated successfully',
        data: paySlip,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating payslip:', error);
      return {
        success: false,
        status: 500,
        message: 'Failed to generate payslip',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

module.exports = PayrollService;