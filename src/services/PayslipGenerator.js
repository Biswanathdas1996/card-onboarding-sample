/**
 * PayslipGenerator Service
 * Generates payslips for employees, detailing their gross pay, deductions, and net pay.
 */

const PayrollCalculator = require('./PayrollCalculator');

const PayslipGenerator = {
  /**
   * Generates a payslip object for an employee.
   * @param {object} employee - The employee object with pay rate and other details.
   * @param {number} hoursWorked - The number of hours worked by the employee.
   * @returns {object} - The generated payslip object.
   */
  generatePayslip: (employee, hoursWorked) => {
    if (!employee || !employee.payRate || hoursWorked === undefined) {
      throw new Error('Employee and hours worked are required.');
    }

    try {
      const grossPay = PayrollCalculator.calculateGrossPay(hoursWorked, employee.payRate);
      const federalTax = PayrollCalculator.calculateFederalTax(grossPay);
      const stateTax = PayrollCalculator.calculateStateTax(grossPay);
      const socialSecurityTax = PayrollCalculator.calculateSocialSecurityTax(grossPay);
      const medicareTax = PayrollCalculator.calculateMedicareTax(grossPay);
      const totalDeductions = federalTax + stateTax + socialSecurityTax + medicareTax;
      const netPay = grossPay - totalDeductions;

      const payslip = {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payPeriod: 'To be implemented', // TODO: Implement pay period logic
        grossPay: grossPay,
        federalTax: federalTax,
        stateTax: stateTax,
        socialSecurityTax: socialSecurityTax,
        medicareTax: medicareTax,
        totalDeductions: totalDeductions,
        netPay: netPay,
        companyName: 'Your Company Name', // Replace with actual company name
      };

      return payslip;
    } catch (error) {
      console.error('Payslip generation error:', error);
      throw new Error('Failed to generate payslip');
    }
  },

  /**
   * Formats the payslip data into a human-readable string (e.g., for printing or display).
   * @param {object} payslip - The payslip object.
   * @returns {string} - The formatted payslip string.
   */
  formatPayslip: (payslip) => {
    if (!payslip) {
      throw new Error('Payslip object is required.');
    }

    const formattedPayslip = `
      Payslip for: ${payslip.employeeName}
      Pay Period: ${payslip.payPeriod}
      Company: ${payslip.companyName}
      ------------------------------------
      Gross Pay: $${payslip.grossPay.toFixed(2)}
      ------------------------------------
      Deductions:
        Federal Tax: $${payslip.federalTax.toFixed(2)}
        State Tax: $${payslip.stateTax.toFixed(2)}
        Social Security Tax: $${payslip.socialSecurityTax.toFixed(2)}
        Medicare Tax: $${payslip.medicareTax.toFixed(2)}
      ------------------------------------
      Total Deductions: $${payslip.totalDeductions.toFixed(2)}
      ------------------------------------
      Net Pay: $${payslip.netPay.toFixed(2)}
    `;

    return formattedPayslip;
  },
};

module.exports = PayslipGenerator;