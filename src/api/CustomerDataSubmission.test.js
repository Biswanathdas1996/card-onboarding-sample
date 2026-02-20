jest.mock('../services/FormValidator');

import CustomerDataSubmission from '../api/CustomerDataSubmission';
import FormValidator from '../services/FormValidator';

describe('CustomerDataSubmission', () => {
  describe('submitCustomerForm', () => {
    it('should return success response when customer data is valid', async () => {
      FormValidator.validateAll.mockReturnValue({});

      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        income: 50000
      };

      const response = await CustomerDataSubmission.submitCustomerForm(customerData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.message).toBe('Customer data submitted successfully');
      expect(response.data).toBeDefined();
      expect(response.data.customerId).toMatch(/^CUST-\d+$/);
      expect(response.data.firstName).toBe(customerData.firstName);
      expect(response.timestamp).toBeDefined();
    });

    it('should return error response when customer data is invalid', async () => {
      const errors = { firstName: 'First name is required' };
      FormValidator.validateAll.mockReturnValue(errors);

      const customerData = {};

      const response = await CustomerDataSubmission.submitCustomerForm(customerData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toEqual(errors);
      expect(response.timestamp).toBeDefined();
    });

    it('should handle errors during submission', async () => {
      FormValidator.validateAll.mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        income: 50000
      };

      const response = await CustomerDataSubmission.submitCustomerForm(customerData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(500);
      expect(response.message).toBe('An error occurred while submitting customer data');
      expect(response.error).toBe('Simulated error');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('submitKYCData', () => {
    it('should return success response when KYC data is valid', async () => {
      FormValidator.validateAll.mockReturnValue({});

      const kycData = {
        govID: '1234567890',
        kycAddress: '456 Elm St',
        kycDob: '1990-01-01',
        pan: 'ABCDE1234F',
        aadhaarNumber: '234567890123'
      };

      const response = await CustomerDataSubmission.submitKYCData(kycData, 'CUST-123');

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.message).toBe('KYC data submitted successfully');
      expect(response.data).toBeDefined();
      expect(response.data.kycId).toMatch(/^KYC-\d+$/);
      expect(response.data.customerId).toBe('CUST-123');
      expect(response.data.verificationStatus).toBe('pending');
      expect(response.timestamp).toBeDefined();
      expect(response.data.encryptedData.govID).toBe(btoa(String(kycData.govID)));
      expect(response.data.encryptedData.kycAddress).toBe(kycData.kycAddress);
    });

    it('should return error response when KYC data is invalid', async () => {
      const errors = { govID: 'Government ID is required' };
      FormValidator.validateAll.mockReturnValue(errors);

      const kycData = {};

      const response = await CustomerDataSubmission.submitKYCData(kycData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toEqual(errors);
      expect(response.timestamp).toBeDefined();
    });

    it('should handle errors during KYC submission', async () => {
      FormValidator.validateAll.mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const kycData = {
        govID: '1234567890',
        kycAddress: '456 Elm St',
        kycDob: '1990-01-01',
        pan: 'ABCDE1234F',
        aadhaarNumber: '234567890123'
      };

      const response = await CustomerDataSubmission.submitKYCData(kycData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(500);
      expect(response.message).toBe('An error occurred while submitting KYC data');
      expect(response.error).toBe('Simulated error');
      expect(response.timestamp).toBeDefined();
    });

    it('should generate a customer ID if one is not provided', async () => {
      FormValidator.validateAll.mockReturnValue({});

      const kycData = {
        govID: '1234567890',
        kycAddress: '456 Elm St',
        kycDob: '1990-01-01',
        pan: 'ABCDE1234F',
        aadhaarNumber: '234567890123'
      };

      const response = await CustomerDataSubmission.submitKYCData(kycData);

      expect(response.data.customerId).toMatch(/^CUST-\d+$/);
    });
  });

  describe('submitCompleteOnboarding', () => {
    it('should return success response when all data is valid', async () => {
      FormValidator.validateAll.mockReturnValue({});

      const allData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        income: 50000,
        govID: '1234567890',
        kycAddress: '456 Elm St',
        kycDob: '1990-01-01',
        pan: 'ABCDE1234F',
        aadhaarNumber: '234567890123'
      };

      const response = await CustomerDataSubmission.submitCompleteOnboarding(allData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.message).toBe('Onboarding completed successfully');
      expect(response.data).toBeDefined();
      expect(response.data.applicationId).toMatch(/^APP-\d+$/);
      expect(response.data.customerId).toMatch(/^CUST-\d+$/);
      expect(response.data.kycId).toMatch(/^KYC-\d+$/);
      expect(response.data.status).toBe('under_review');
      expect(response.timestamp).toBeDefined();
      expect(response.data.encryptedData.govID).toBe(btoa(String(allData.govID)));
      expect(response.data.encryptedData.firstName).toBe(allData.firstName);
    });

    it('should return error response when data is invalid', async () => {
      const errors = { firstName: 'First name is required', govID: 'Government ID is required' };
      FormValidator.validateAll.mockImplementation((data, type) => {
        if (type === 'customer' && !data.firstName) {
          return { firstName: 'First name is required' };
        } else if (type === 'kyc' && !data.govID) {
          return { govID: 'Government ID is required' };
        }
        return {};
      });

      const allData = {};

      const response = await CustomerDataSubmission.submitCompleteOnboarding(allData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toEqual({ firstName: 'First name is required', govID: 'Government ID is required' });
      expect(response.timestamp).toBeDefined();
    });

    it('should handle errors during complete onboarding', async () => {
      FormValidator.validateAll.mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const allData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        income: 50000,
        govID: '1234567890',
        kycAddress: '456 Elm St',
        kycDob: '1990-01-01',
        pan: 'ABCDE1234F',
        aadhaarNumber: '234567890123'
      };

      const response = await CustomerDataSubmission.submitCompleteOnboarding(allData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(500);
      expect(response.message).toBe('An error occurred during onboarding');
      expect(response.error).toBe('Simulated error');
      expect(response.timestamp).toBeDefined();
    });
  });
});