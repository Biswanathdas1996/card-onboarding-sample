/**
 * CustomerDataSubmission API Service (Database Version)
 * Handles submission of customer form and KYC data with database persistence
 */

import FormValidator from '../services/FormValidator';

/**
 * API Base URL pointing to Express backend
 */
const API_BASE_URL = 'http://localhost:5000';

/**
 * Simulated API delay for realistic behavior
 */
const simulateNetworkDelay = (ms = 500) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate a valid UUID v4
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const CustomerDataSubmission = {
  /**
   * Submit customer form data to database
   * @param {object} customerData - Customer form data
   * @returns {Promise<object>} - API response with customer ID
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

      // Call backend API to save customer data to database
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phoneNumber: customerData.phone,
          accountType: customerData.accountType || 'individual',
          employmentStatus: customerData.employmentStatus || null,
          annualIncome: customerData.income || null,
          dateOfBirth: customerData.dateOfBirth || null,
          nationality: customerData.nationality || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          status: response.status,
          message: errorData.message || 'Failed to submit customer form',
          error: errorData.error,
          timestamp: new Date().toISOString()
        };
      }

      const result = await response.json();

      console.log('Customer data saved:', result);

      return {
        success: true,
        status: 201,
        message: 'Customer data submitted successfully',
        data: {
          customerId: result.customerId,
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
   * Submit KYC data to database
   * @param {object} kycData - KYC form data
   * @param {string} customerId - Customer ID from previous submission
   * @returns {Promise<object>} - API response with KYC ID
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

      // Validate that customer ID is provided
      if (!customerId) {
        return {
          success: false,
          status: 400,
          message: 'Customer ID is required. Please submit the customer form first.',
          timestamp: new Date().toISOString()
        };
      }

      // Call backend API to save KYC data to database
      const response = await fetch(`${API_BASE_URL}/api/kyc/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          govID: (kycData.govID || '').substring(0, 20),
          govIDType: (kycData.govIDType || 'passport').substring(0, 50),
          pan: (kycData.pan || '').substring(0, 50),
          dateOfBirth: kycData.kycDob,
          nationality: (kycData.nationality || '').substring(0, 100),
          kycAddress: (kycData.kycAddress || '').substring(0, 1000),
          city: (kycData.city || '').substring(0, 100),
          state: (kycData.state || '').substring(0, 100),
          postalCode: (kycData.postalCode || '').substring(0, 20),
          country: (kycData.country || '').substring(0, 100),
          occupation: (kycData.occupation || '').substring(0, 100),
          politicallyExposedPerson: kycData.politicallyExposedPerson || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          status: response.status,
          message: errorData.message || 'Failed to submit KYC data',
          code: errorData.code,
          error: errorData.error,
          timestamp: new Date().toISOString()
        };
      }

      const result = await response.json();

      console.log('KYC data saved:', result);

      return {
        success: true,
        status: 201,
        message: 'KYC data submitted successfully',
        data: {
          kycId: result.kycId,
          customerId: customerId,
          verificationStatus: 'pending',
          createdAt: result.createdAt
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
   * Handles transaction-like behavior with customer and KYC submission
   * @param {object} allData - Combined customer and KYC data
   * @returns {Promise<object>} - API response with customer and KYC IDs
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
          pan: allData.pan
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

      // Step 1: Submit customer form
      const customerResponse = await CustomerDataSubmission.submitCustomerForm({
        firstName: allData.firstName,
        lastName: allData.lastName,
        email: allData.email,
        phone: allData.phone,
        accountType: allData.accountType || 'individual',
        employmentStatus: allData.employmentStatus || null,
        dateOfBirth: allData.dateOfBirth,
        nationality: allData.nationality || null,
        income: allData.income,
      });

      if (!customerResponse.success) {
        return customerResponse;
      }

      const customerId = customerResponse.data.customerId;

      // Step 2: Submit KYC data
      const kycResponse = await CustomerDataSubmission.submitKYCData(
        {
          govID: allData.govID,
          govIDType: allData.govIDType || 'passport',
          pan: allData.pan,
          kycDob: allData.kycDob,
          nationality: allData.nationality || null,
          kycAddress: allData.kycAddress,
          city: allData.city || null,
          state: allData.state || null,
          postalCode: allData.zipCode || null,
          country: allData.country || null,
          occupation: allData.occupation || null,
          politicallyExposedPerson: allData.politicallyExposedPerson || false,
        },
        customerId
      );

      if (!kycResponse.success) {
        return kycResponse;
      }

      const kycId = kycResponse.data.kycId;

      return {
        success: true,
        status: 201,
        message: 'Onboarding completed successfully',
        data: {
          applicationId: `APP-${Date.now()}`,
          customerId: customerId,
          kycId: kycId,
          status: 'under_review',
          createdAt: new Date().toISOString(),
          nextSteps: 'Your KYC information is being reviewed. You will receive updates shortly.'
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
  },

  /**
   * Retrieve customer data from database
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} - Customer data
   */
  getCustomer: async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`);

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: 'Customer not found',
          timestamp: new Date().toISOString()
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: 200,
        data: data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while retrieving customer data',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Retrieve KYC data from database
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} - KYC data
   */
  getKYC: async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc/${customerId}`);

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: 'KYC data not found',
          timestamp: new Date().toISOString()
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: 200,
        data: data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error retrieving KYC:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while retrieving KYC data',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default CustomerDataSubmission;
