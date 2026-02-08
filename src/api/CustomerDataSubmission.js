/**
 * CustomerDataSubmission API Service
 * Handles submission of customer form and KYC data with validation and encryption
 */

import FormValidator from '../services/FormValidator';

/**
 * Simple encryption/obfuscation for sensitive data
 * In production, use proper encryption libraries
 */
const encryptSensitiveData = (data) => {
  // Basic base64 encoding for demonstration
  // In production, use proper encryption (e.g., TweetNaCl.js, crypto-js)
  const sensitiveFields = ['govID', 'ssn', 'kycDob', 'pan'];
  const encrypted = { ...data };

  sensitiveFields.forEach((field) => {
    if (encrypted[field]) {
      encrypted[field] = btoa(String(encrypted[field]));
    }
  });

  return encrypted;
};

/**
 * Simulated API delay for realistic behavior
 */
const simulateNetworkDelay = (ms = 500) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const CustomerDataSubmission = {
  /**
   * Submit customer form data
   * @param {object} customerData - Customer form data
   * @returns {Promise<object>} - API response
   */
  submitCustomerForm: async (customerData) => {
    try {
      // Validate customer data
      const errors = FormValidator.validateAll(customerData, 'customer');
      if (Object.keys(errors).length > 0) {
        return {
          success: false,
          status: 400,
          message: 'Validation failed',
          errors: errors,
          timestamp: new Date().toISOString()
        };
      }

      // Simulate network delay
      await simulateNetworkDelay(300);

      // Mock API response
      console.log('Submitting customer data:', customerData);

      return {
        success: true,
        status: 200,
        message: 'Customer data submitted successfully',
        data: {
          customerId: `CUST-${Date.now()}`,
          ...customerData
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error submitting customer form:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while submitting customer data',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Submit KYC data
   * @param {object} kycData - KYC form data
   * @param {string} customerId - Customer ID from previous submission
   * @returns {Promise<object>} - API response
   */
  submitKYCData: async (kycData, customerId = null) => {
    try {
      // Validate KYC data
      const errors = FormValidator.validateAll(kycData, 'kyc');
      if (Object.keys(errors).length > 0) {
        return {
          success: false,
          status: 400,
          message: 'Validation failed',
          errors: errors,
          timestamp: new Date().toISOString()
        };
      }

      // Simulate network delay
      await simulateNetworkDelay(400);

      // Encrypt sensitive data
      const encryptedData = encryptSensitiveData(kycData);

      // Mock API response
      console.log('Submitting KYC data:', encryptedData);

      return {
        success: true,
        status: 200,
        message: 'KYC data submitted successfully',
        data: {
          kycId: `KYC-${Date.now()}`,
          customerId: customerId || `CUST-${Date.now()}`,
          encryptedData: encryptedData,
          verificationStatus: 'pending'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error submitting KYC data:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while submitting KYC data',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Submit complete onboarding (customer form + KYC data)
   * @param {object} allData - Combined customer and KYC data
   * @returns {Promise<object>} - API response
   */
  submitCompleteOnboarding: async (allData) => {
    try {
      // Validate customer data
      const customerErrors = FormValidator.validateAll(
        {
          firstName: allData.firstName,
          lastName: allData.lastName,
          email: allData.email,
          phone: allData.phone,
          dateOfBirth: allData.dateOfBirth,
          address: allData.address,
          city: allData.city,
          state: allData.state,
          zipCode: allData.zipCode,
          income: allData.income
        },
        'customer'
      );

      // Validate KYC data
      const kycErrors = FormValidator.validateAll(
        {
          govID: allData.govID,
          kycAddress: allData.kycAddress,
          kycDob: allData.kycDob,
          pan: allData.pan,
          aadhaarNumber: allData.aadhaarNumber
        },
        'kyc'
      );

      const allErrors = { ...customerErrors, ...kycErrors };
      if (Object.keys(allErrors).length > 0) {
        return {
          success: false,
          status: 400,
          message: 'Validation failed',
          errors: allErrors,
          timestamp: new Date().toISOString()
        };
      }

      // Simulate network delay
      await simulateNetworkDelay(600);

      // Encrypt sensitive data
      const encryptedData = encryptSensitiveData(allData);

      // Mock API response
      console.log('Submitting complete onboarding:', encryptedData);

      return {
        success: true,
        status: 200,
        message: 'Onboarding completed successfully',
        data: {
          applicationId: `APP-${Date.now()}`,
          customerId: `CUST-${Date.now()}`,
          kycId: `KYC-${Date.now()}`,
          status: 'under_review',
          encryptedData: encryptedData
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error submitting complete onboarding:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred during onboarding',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default CustomerDataSubmission;
