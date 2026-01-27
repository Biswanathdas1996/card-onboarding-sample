/**
 * CustomerDataSubmission.test.js
 * Unit tests for CustomerDataSubmission API service
 */

import CustomerDataSubmission from '../api/CustomerDataSubmission';

describe('CustomerDataSubmission API Service', () => {
  beforeEach(() => {
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Customer Form Submission Tests
  describe('submitCustomerForm', () => {
    test('should return success response for valid customer data', async () => {
      const validCustomerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k'
      };

      const response = await CustomerDataSubmission.submitCustomerForm(validCustomerData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.message).toContain('successfully');
      expect(response.data).toHaveProperty('customerId');
    });

    test('should return validation error for invalid customer data', async () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '123',
        dateOfBirth: '',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k'
      };

      const response = await CustomerDataSubmission.submitCustomerForm(invalidData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.errors).toHaveProperty('firstName');
      expect(response.errors).toHaveProperty('email');
    });

    test('should return error response for incomplete customer data', async () => {
      const incompleteData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const response = await CustomerDataSubmission.submitCustomerForm(incompleteData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  // KYC Data Submission Tests
  describe('submitKYCData', () => {
    test('should return success response for valid KYC data', async () => {
      const validKYCData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, Apartment 4B',
        kycDob: '1990-01-01'
      };

      const response = await CustomerDataSubmission.submitKYCData(validKYCData, 'CUST-12345');

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('kycId');
      expect(response.data.verificationStatus).toBe('pending');
    });

    test('should encrypt sensitive data before submission', async () => {
      const validKYCData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, Apartment 4B',
        kycDob: '1990-01-01'
      };

      const response = await CustomerDataSubmission.submitKYCData(validKYCData);

      // Check that sensitive data is encrypted in the response
      expect(response.data.encryptedData.govID).not.toBe('A12B34C56');
      expect(response.data.encryptedData.kycDob).not.toBe('1990-01-01');
    });

    test('should return validation error for invalid KYC data', async () => {
      const invalidData = {
        govID: '',
        kycAddress: 'too short',
        kycDob: '2010-01-01' // Future for someone who should be 18+
      };

      const response = await CustomerDataSubmission.submitKYCData(invalidData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.errors).toHaveProperty('govID');
    });
  });

  // Complete Onboarding Tests
  describe('submitCompleteOnboarding', () => {
    test('should return success for valid complete onboarding data', async () => {
      const completeData = {
        // Customer fields
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k',
        // KYC fields
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, Apartment 4B',
        kycDob: '1990-01-01'
      };

      const response = await CustomerDataSubmission.submitCompleteOnboarding(completeData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('applicationId');
      expect(response.data).toHaveProperty('customerId');
      expect(response.data).toHaveProperty('kycId');
      expect(response.data.status).toBe('under_review');
    });

    test('should return validation errors for invalid complete data', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid',
        phone: '123',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        income: '',
        govID: '',
        kycAddress: 'short',
        kycDob: ''
      };

      const response = await CustomerDataSubmission.submitCompleteOnboarding(invalidData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(Object.keys(response.errors).length).toBeGreaterThan(0);
    });
  });

  // Response Structure Tests
  describe('Response Structure', () => {
    test('all responses should include timestamp', async () => {
      const validData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-01'
      };

      const response = await CustomerDataSubmission.submitKYCData(validData);

      expect(response).toHaveProperty('timestamp');
      expect(response.timestamp).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    test('successful responses should include all required properties', async () => {
      const validData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-01'
      };

      const response = await CustomerDataSubmission.submitKYCData(validData);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('timestamp');
    });

    test('error responses should include all required properties', async () => {
      const invalidData = {
        govID: '',
        kycAddress: '',
        kycDob: ''
      };

      const response = await CustomerDataSubmission.submitKYCData(invalidData);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('timestamp');
    });
  });

  // Performance Tests
  describe('Performance', () => {
    test('customer form submission should complete within 1 second', async () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k'
      };

      const startTime = Date.now();
      await CustomerDataSubmission.submitCustomerForm(validData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('KYC submission should complete within 1 second', async () => {
      const validData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-01'
      };

      const startTime = Date.now();
      await CustomerDataSubmission.submitKYCData(validData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('complete onboarding should complete within 2 seconds', async () => {
      const completeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k',
        govID: 'A12B34C56',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-01'
      };

      const startTime = Date.now();
      await CustomerDataSubmission.submitCompleteOnboarding(completeData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
