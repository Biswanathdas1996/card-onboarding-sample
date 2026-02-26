import CustomerDataSubmission from './CustomerDataSubmission';
import FormValidator from '../services/FormValidator';

// Mock FormValidator to control validation outcomes
jest.mock('../services/FormValidator', () => ({
  validateAll: jest.fn(),
}));

// Mock setTimeout for simulateNetworkDelay
jest.useFakeTimers();

describe('CustomerDataSubmission', () => {
  const mockCustomerData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    income: 50000,
  };

  const mockKycData = {
    govID: 'ABC12345',
    kycAddress: '123 Main St',
    kycDob: '1990-01-01',
    pan: 'PAN12345',
    aadhaarNumber: '123456789012',
  };

  const mockCompleteOnboardingData = {
    ...mockCustomerData,
    ...mockKycData,
  };

  beforeEach(() => {
    // Reset mocks before each test
    FormValidator.validateAll.mockClear();
    jest.clearAllTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore console.log and console.error
  });

  describe('submitCustomerForm', () => {
    test('should successfully submit customer data with valid input', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({}); // No validation errors

      // Act
      const promise = CustomerDataSubmission.submitCustomerForm(mockCustomerData);
      jest.runAllTimers(); // Advance timers to resolve simulateNetworkDelay
      const result = await promise;

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith(mockCustomerData, 'customer');
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe('Customer data submitted successfully');
      expect(result.data).toMatchObject(mockCustomerData);
      expect(result.data).toHaveProperty('customerId');
      expect(result).toHaveProperty('timestamp');
    });

    test('should return validation errors for invalid customer data', async () => {
      // Arrange
      const validationErrors = {
        firstName: 'First name is required',
        email: 'Invalid email format',
      };
      FormValidator.validateAll.mockReturnValue(validationErrors);

      // Act
      const result = await CustomerDataSubmission.submitCustomerForm({}); // Invalid data

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith({}, 'customer');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual(validationErrors);
      expect(result).toHaveProperty('timestamp');
    });

    test('should handle unexpected errors during submission', async () => {
      // Arrange
      const errorMessage = 'Network error';
      FormValidator.validateAll.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Act
      const result = await CustomerDataSubmission.submitCustomerForm(mockCustomerData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.message).toBe('An error occurred while submitting customer data');
      expect(result.error).toBe(errorMessage);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('submitKYCData', () => {
    test('should successfully submit KYC data with valid input and encrypt sensitive fields', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({}); // No validation errors

      // Act
      const promise = CustomerDataSubmission.submitKYCData(mockKycData, 'CUST-123');
      jest.runAllTimers(); // Advance timers
      const result = await promise;

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith(mockKycData, 'kyc');
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe('KYC data submitted successfully');
      expect(result.data).toHaveProperty('kycId');
      expect(result.data.customerId).toBe('CUST-123');
      expect(result.data.verificationStatus).toBe('pending');
      expect(result.data.encryptedData.govID).not.toBe(mockKycData.govID); // Should be encrypted
      expect(result.data.encryptedData.pan).not.toBe(mockKycData.pan); // Should be encrypted
      expect(result.data.encryptedData.kycDob).not.toBe(mockKycData.kycDob); // Should be encrypted
      expect(result.data.encryptedData.aadhaarNumber).toBe(mockKycData.aadhaarNumber); // Should not be encrypted
      expect(result).toHaveProperty('timestamp');
    });

    test('should generate a customerId if not provided', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({});

      // Act
      const promise = CustomerDataSubmission.submitKYCData(mockKycData);
      jest.runAllTimers();
      const result = await promise;

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('customerId');
      expect(result.data.customerId).toMatch(/^CUST-\d+$/);
    });

    test('should return validation errors for invalid KYC data', async () => {
      // Arrange
      const validationErrors = {
        govID: 'Government ID is required',
        pan: 'Invalid PAN format',
      };
      FormValidator.validateAll.mockReturnValue(validationErrors);

      // Act
      const result = await CustomerDataSubmission.submitKYCData({}); // Invalid data

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith({}, 'kyc');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual(validationErrors);
      expect(result).toHaveProperty('timestamp');
    });

    test('should handle unexpected errors during KYC submission', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      FormValidator.validateAll.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Act
      const result = await CustomerDataSubmission.submitKYCData(mockKycData, 'CUST-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.message).toBe('An error occurred while submitting KYC data');
      expect(result.error).toBe(errorMessage);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('submitCompleteOnboarding', () => {
    test('should successfully submit complete onboarding data with valid input', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({}); // No validation errors for customer or KYC

      // Act
      const promise = CustomerDataSubmission.submitCompleteOnboarding(mockCompleteOnboardingData);
      jest.runAllTimers(); // Advance timers
      const result = await promise;

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(2);
      expect(FormValidator.validateAll).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: mockCompleteOnboardingData.firstName,
          email: mockCompleteOnboardingData.email,
        }),
        'customer'
      );
      expect(FormValidator.validateAll).toHaveBeenCalledWith(
        expect.objectContaining({
          govID: mockCompleteOnboardingData.govID,
          pan: mockCompleteOnboardingData.pan,
        }),
        'kyc'
      );
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe('Onboarding completed successfully');
      expect(result.data).toHaveProperty('applicationId');
      expect(result.data).toHaveProperty('customerId');
      expect(result.data).toHaveProperty('kycId');
      expect(result.data.status).toBe('under_review');
      expect(result.data.encryptedData.govID).not.toBe(mockCompleteOnboardingData.govID); // Should be encrypted
      expect(result.data.encryptedData.pan).not.toBe(mockCompleteOnboardingData.pan); // Should be encrypted
      expect(result).toHaveProperty('timestamp');
    });

    test('should return validation errors for invalid customer data in complete onboarding', async () => {
      // Arrange
      const customerValidationErrors = {
        firstName: 'First name is required',
      };
      FormValidator.validateAll
        .mockReturnValueOnce(customerValidationErrors) // Customer validation fails
        .mockReturnValueOnce({}); // KYC validation passes

      // Act
      const result = await CustomerDataSubmission.submitCompleteOnboarding({}); // Invalid customer data

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual(customerValidationErrors);
      expect(result).toHaveProperty('timestamp');
    });

    test('should return validation errors for invalid KYC data in complete onboarding', async () => {
      // Arrange
      const kycValidationErrors = {
        govID: 'Government ID is required',
      };
      FormValidator.validateAll
        .mockReturnValueOnce({}) // Customer validation passes
        .mockReturnValueOnce(kycValidationErrors); // KYC validation fails

      // Act
      const result = await CustomerDataSubmission.submitCompleteOnboarding({}); // Invalid KYC data

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual(kycValidationErrors);
      expect(result).toHaveProperty('timestamp');
    });

    test('should return combined validation errors for both invalid customer and KYC data', async () => {
      // Arrange
      const customerValidationErrors = {
        firstName: 'First name is required',
      };
      const kycValidationErrors = {
        govID: 'Government ID is required',
      };
      FormValidator.validateAll
        .mockReturnValueOnce(customerValidationErrors)
        .mockReturnValueOnce(kycValidationErrors);

      // Act
      const result = await CustomerDataSubmission.submitCompleteOnboarding({});

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual({ ...customerValidationErrors, ...kycValidationErrors });
      expect(result).toHaveProperty('timestamp');
    });

    test('should handle unexpected errors during complete onboarding submission', async () => {
      // Arrange
      const errorMessage = 'Service unavailable';
      FormValidator.validateAll.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Act
      const result = await CustomerDataSubmission.submitCompleteOnboarding(mockCompleteOnboardingData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.message).toBe('An error occurred during onboarding');
      expect(result.error).toBe(errorMessage);
      expect(result).toHaveProperty('timestamp');
    });
  });
});