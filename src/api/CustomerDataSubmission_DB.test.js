import CustomerDataSubmission from './CustomerDataSubmission_DB';
import FormValidator from '../services/FormValidator';

// Mock external dependencies
jest.mock('../services/FormValidator');

// Mock fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.error and console.log to prevent them from cluttering test output
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('CustomerDataSubmission_DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset FormValidator mock before each test
    FormValidator.validateAll.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('submitCustomerForm', () => {
    const validCustomerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      income: 50000,
      accountType: 'individual',
      employmentStatus: 'employed',
      nationality: 'American',
    };

    it('should successfully submit customer data and return success response', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({}); // No validation errors
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ customerId: 'cust_123', message: 'Customer created' }),
      });

      // Act
      const response = await CustomerDataSubmission.submitCustomerForm(validCustomerData);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith(expect.any(Object), 'customer');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: validCustomerData.firstName,
            lastName: validCustomerData.lastName,
            email: validCustomerData.email,
            phoneNumber: validCustomerData.phone,
            accountType: validCustomerData.accountType,
            employmentStatus: validCustomerData.employmentStatus,
            annualIncome: validCustomerData.income,
            dateOfBirth: validCustomerData.dateOfBirth,
            nationality: validCustomerData.nationality,
          }),
        })
      );
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          status: 201,
          message: 'Customer data submitted successfully',
          data: {
            customerId: 'cust_123',
            ...validCustomerData,
          },
        })
      );
      expect(response.timestamp).toBeDefined();
    });

    it('should return validation errors if customer data is invalid', async () => {
      // Arrange
      const invalidCustomerData = { ...validCustomerData, firstName: '' };
      const validationErrors = { firstName: 'First name is required' };
      FormValidator.validateAll.mockReturnValue(validationErrors);

      // Act
      const response = await CustomerDataSubmission.submitCustomerForm(invalidCustomerData);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith(expect.any(Object), 'customer');
      expect(mockFetch).not.toHaveBeenCalled(); // Should not call fetch if validation fails
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 400,
          message: 'Validation failed',
          errors: validationErrors,
        })
      );
      expect(response.timestamp).toBeDefined();
    });

    it('should handle API error response when submitting customer data', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({});
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid input', error: 'Bad Request' }),
      });

      // Act
      const response = await CustomerDataSubmission.submitCustomerForm(validCustomerData);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 400,
          message: 'Invalid input',
          error: 'Bad Request',
        })
      );
      expect(response.timestamp).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(0); // No console.error for API errors
    });

    it('should handle network error during customer data submission', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({});
      mockFetch.mockRejectedValueOnce(new Error('Network down'));

      // Act
      const response = await CustomerDataSubmission.submitCustomerForm(validCustomerData);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 500,
          message: 'An error occurred while submitting customer data',
          error: 'Network down',
        })
      );
      expect(response.timestamp).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting customer form:', expect.any(Error));
    });

    it('should use default values for optional fields if not provided', async () => {
      // Arrange
      const partialCustomerData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '0987654321',
      };
      FormValidator.validateAll.mockReturnValue({});
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ customerId: 'cust_456', message: 'Customer created' }),
      });

      // Act
      const response = await CustomerDataSubmission.submitCustomerForm(partialCustomerData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: partialCustomerData.firstName,
            lastName: partialCustomerData.lastName,
            email: partialCustomerData.email,
            phoneNumber: partialCustomerData.phone,
            accountType: 'individual', // Default value
            employmentStatus: null, // Default value
            annualIncome: null, // Default value
            dateOfBirth: null, // Default value
            nationality: null, // Default value
          }),
        })
      );
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          status: 201,
          message: 'Customer data submitted successfully',
          data: {
            customerId: 'cust_456',
            ...partialCustomerData,
          },
        })
      );
    });
  });

  describe('submitKYCData', () => {
    const validKycData = {
      govID: 'ABC12345',
      govIDType: 'passport',
      pan: 'PAN12345',
      kycDob: '1985-05-10',
      nationality: 'Indian',
      kycAddress: '456 Oak Ave',
      city: 'Someville',
      state: 'NY',
      postalCode: '67890',
      country: 'USA',
      occupation: 'Engineer',
      politicallyExposedPerson: false,
    };
    const customerId = 'cust_123';

    it('should successfully submit KYC data and return success response', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({}); // No validation errors
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ kycId: 'kyc_789', createdAt: new Date().toISOString() }),
      });

      // Act
      const response = await CustomerDataSubmission.submitKYCData(validKycData, customerId);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith(expect.any(Object), 'kyc');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:5000/api/kyc/${customerId}`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            govID: validKycData.govID,
            govIDType: validKycData.govIDType,
            pan: validKycData.pan,
            dateOfBirth: validKycData.kycDob,
            nationality: validKycData.nationality,
            kycAddress: validKycData.kycAddress,
            city: validKycData.city,
            state: validKycData.state,
            postalCode: validKycData.postalCode,
            country: validKycData.country,
            occupation: validKycData.occupation,
            politicallyExposedPerson: validKycData.politicallyExposedPerson,
          }),
        })
      );
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          status: 201,
          message: 'KYC data submitted successfully',
          data: {
            kycId: 'kyc_789',
            customerId: customerId,
            verificationStatus: 'pending',
            createdAt: expect.any(String),
          },
        })
      );
      expect(response.timestamp).toBeDefined();
    });

    it('should return validation errors if KYC data is invalid', async () => {
      // Arrange
      const invalidKycData = { ...validKycData, govID: '' };
      const validationErrors = { govID: 'Government ID is required' };
      FormValidator.validateAll.mockReturnValue(validationErrors);

      // Act
      const response = await CustomerDataSubmission.submitKYCData(invalidKycData, customerId);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledWith(expect.any(Object), 'kyc');
      expect(mockFetch).not.toHaveBeenCalled(); // Should not call fetch if validation fails
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 400,
          message: 'Validation failed',
          errors: validationErrors,
        })
      );
      expect(response.timestamp).toBeDefined();
    });

    it('should return error if customerId is not provided', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({});

      // Act
      const response = await CustomerDataSubmission.submitKYCData(validKycData, null);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 400,
          message: 'Customer ID is required. Please submit the customer form first.',
        })
      );
      expect(response.timestamp).toBeDefined();
    });

    it('should handle API error response when submitting KYC data', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({});
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid KYC data', error: 'Bad Request' }),
      });

      // Act
      const response = await CustomerDataSubmission.submitKYCData(validKycData, customerId);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 400,
          message: 'Invalid KYC data',
          error: 'Bad Request',
        })
      );
      expect(response.timestamp).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(0); // No console.error for API errors
    });

    it('should handle network error during KYC data submission', async () => {
      // Arrange
      FormValidator.validateAll.mockReturnValue({});
      mockFetch.mockRejectedValueOnce(new Error('Network down for KYC'));

      // Act
      const response = await CustomerDataSubmission.submitKYCData(validKycData, customerId);

      // Assert
      expect(FormValidator.validateAll).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        expect.objectContaining({
          success: false,
          status: 500,
          message: 'An error occurred while submitting KYC data',
          error: 'Network down for KYC',
        })
      );
      expect(response.timestamp).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting KYC data:', expect.any(Error));
    });

    it('should use default values for optional KYC fields if not provided', async () => {
      // Arrange
      const partialKycData = {
        govID: 'DEF67890',
        kycDob: '1995-11-20',
      };
      FormValidator.validateAll.mockReturnValue({});
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ kycId: 'kyc_101', createdAt: new Date().toISOString() }),
      });

      // Act
      const response = await CustomerDataSubmission.submitKYCData(partialKycData, customerId);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:5000/api/kyc/${customerId}`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            govID: partialKycData.govID,
            govIDType: 'passport', // Default value
            pan: '', // Default value
            dateOfBirth: partialKycData.kycDob,
            nationality: '', // Default value
            kycAddress: '', // Default value
            city: '', // Default value
            state: '', // Default value
            postalCode: '', // Default value
            country: '', // Default value
            occupation: '', // Default value
            politicallyExposedPerson: false, // Default value
          }),
        })
      );
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          status: 201,
          message: 'KYC data submitted successfully',
          data: {
            kycId: 'kyc_101',
            customerId: customerId,
            verificationStatus: 'pending',
            createdAt: expect.any(String),
          },
        })
      );
    });
  });
});