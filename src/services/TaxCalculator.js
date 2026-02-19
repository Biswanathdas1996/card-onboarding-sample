/**
 * TaxCalculator Service
 * Provides methods for calculating and deducting taxes and contributions from gross pay.
 */

const TaxCalculator = {
  /**
   * Calculates federal income tax based on gross pay (Placeholder).
   * @param {number} grossPay - The gross pay.
   * @returns {number} - The calculated federal income tax.
   */
  calculateFederalTax: (grossPay) => {
    // TODO: Implement actual tax calculation logic based on tax brackets and employee information.
    // This is a placeholder and should be replaced with a real implementation.
    const taxRate = 0.20; // Example tax rate
    const federalTax = grossPay * taxRate;
    return parseFloat(federalTax.toFixed(2));
  },

  /**
   * Calculates state income tax based on gross pay (Placeholder).
   * @param {number} grossPay - The gross pay.
   * @returns {number} - The calculated state income tax.
   */
  calculateStateTax: (grossPay) => {
    // TODO: Implement actual tax calculation logic based on state tax laws and employee information.
    // This is a placeholder and should be replaced with a real implementation.
    const taxRate = 0.05; // Example tax rate
    const stateTax = grossPay * taxRate;
    return parseFloat(stateTax.toFixed(2));
  },

  /**
   * Calculates social security tax based on gross pay.
   * @param {number} grossPay - The gross pay.
   * @returns {number} - The calculated social security tax.
   */
  calculateSocialSecurityTax: (grossPay) => {
    const taxRate = 0.062; // Social Security tax rate for 2023
    const socialSecurityTax = grossPay * taxRate;
    return parseFloat(socialSecurityTax.toFixed(2));
  },

  /**
   * Calculates Medicare tax based on gross pay.
   * @param {number} grossPay - The gross pay.
   * @returns {number} - The calculated Medicare tax.
   */
  calculateMedicareTax: (grossPay) => {
    const taxRate = 0.0145; // Medicare tax rate
    const medicareTax = grossPay * taxRate;
    return parseFloat(medicareTax.toFixed(2));
  },

  /**
   * Calculates total deductions based on individual tax amounts.
   * @param {number} federalTax - The federal income tax.
   * @param {number} stateTax - The state income tax.
   * @param {number} socialSecurityTax - The social security tax.
   * @param {number} medicareTax - The medicare tax.
   * @returns {number} - The total deductions.
   */
  calculateTotalDeductions: (federalTax, stateTax, socialSecurityTax, medicareTax) => {
    const totalDeductions = federalTax + stateTax + socialSecurityTax + medicareTax;
    return parseFloat(totalDeductions.toFixed(2));
  },

  /**
   * Calculates net pay after deducting taxes and contributions.
   * @param {number} grossPay - The gross pay.
   * @param {number} totalDeductions - The total deductions.
   * @returns {number} - The calculated net pay.
   */
  calculateNetPay: (grossPay, totalDeductions) => {
    const netPay = grossPay - totalDeductions;
    return parseFloat(netPay.toFixed(2));
  }
};

module.exports = TaxCalculator;