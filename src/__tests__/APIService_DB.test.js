const APIService = require('../../api/APIService_DB');
const KYCModelDB = require('../../db/models/KYCModel');
const KYCModel = require('../../api/KYCModel');

jest.mock('../../db/models/KYCModel');
jest.mock('../../api/KYCModel');

// Mock the internal simulateNetworkDelay function
// Since it's not exported, we need to mock it within the APIService module.
// This is a common pattern for internal functions.
// We'll use jest.spyOn to mock the internal function if it were accessible,
// but since it's not, we'll assume the APIService itself is being tested
// and the delay is part of its implementation.
// For the purpose of this fix, we'll ensure that the test setup
// doesn't inadvertently cause issues that could lead to the Python error.
// The Python error "unsupported operand type(s) for +: 'NoneType' and 'str'"
// is highly unusual for a Javascript test. This suggests an environment issue
// or a misinterpretation of the error.
// Given the constraint to fix *only* the test file, and assuming the error
// is somehow triggered by the test's interaction with the APIService,
// we will ensure the mocks are correctly set up and the test logic is sound.

// Let's ensure that `simulateNetworkDelay` is effectively bypassed or controlled
// during tests. Since it's an internal function, we can't directly mock it
// using `jest.mock` on its own. However, if `APIService` is an object,
// we can spy on its methods or mock its dependencies.
// The `simulateNetworkDelay` is called inside `submitKYCData` and `getKYCData`.
// For testing, we want these to resolve immediately.
// A common way to handle this without modifying the source is to mock `setTimeout`
// or to ensure that the async operations resolve quickly.
// Given the error is Python-specific, it's unlikely to be directly related to
// `simulateNetworkDelay`'s implementation in JS.

// We will focus on ensuring the test setup is robust and doesn't introduce
// any `null` or `undefined` values into string operations that might be
// implicitly handled by a Python-based test runner or logging system.

describe('APIService_DB', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock setTimeout to run immediately for simulateNetworkDelay
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('submitKYCData', () => {
    const mockKycData = {
      govID: 'ABC12345',
      kycAddress: '123 Test St',
      kycDob: '1990-01-01',
      pan: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
      govIDType: 'Passport',
      nationality: 'Indian',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      occupation: 'Engineer',
      politicallyExposedPerson: false,
    };
    const mockCustomerId = 'cust_123';
    const mockMetadata = {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should successfully submit KYC data and return a 201 status', async () => {
      KYCModel.validatePAN.mockReturnValue(true);
      KYCModel.validateGovID.mockReturnValue(true);
      KYCModel.validateAadhaar.mockReturnValue(true);
      KYCModel.validateDate.mockReturnValue(true);
      KYCModelDB.panExists.mockResolvedValue(false);
      KYCModelDB.create.mockResolvedValue({
        success: true,
        kycId: 'kyc_abc',
        createdAt: new Date().toISOString(),
      });

      const response = await APIService.submitKYCData(mockKycData, mockCustomerId, mockMetadata);
      jest.runAllTimers(); // Advance timers for simulateNetworkDelay

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.message).toBe('KYC data submitted successfully');
      expect(response.data).toHaveProperty('kycId', 'kyc_abc');
      expect(response.data).toHaveProperty('customerId', mockCustomerId);
      expect(response.data).toHaveProperty('verificationStatus', 'pending');
      expect(KYCModelDB.create).toHaveBeenCalledTimes(1);
      expect(KYCModelDB.create).toHaveBeenCalledWith(mockCustomerId, {
        pan: mockKycData.pan,
        govID: mockKycData.govID,
        aadhaarNumber: mockKycData.aadhaarNumber,
        govIDType: mockKycData.govIDType,
        dateOfBirth: mockKycData.kycDob,
        nationality: mockKycData.nationality,
        kycAddress: mockKycData.kycAddress,
        city: mockKycData.city,
        state: mockKycData.state,
        postalCode: mockKycData.postalCode,
        country: mockKycData.country,
        occupation: mockKycData.occupation,
        politicallyExposedPerson: mockKycData.politicallyExposedPerson,
        ipAddress: mockMetadata.ip,
        userAgent: mockMetadata.userAgent,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteKycData = { ...mockKycData,
        govID: undefined,
        pan: undefined
      };
      const response = await APIService.submitKYCData(incompleteKycData, mockCustomerId, mockMetadata);
      jest.runAllTimers();

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toContain('Missing required fields: govID, pan');
      expect(KYCModelDB.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid PAN format', async () => {
      KYCModel.validatePAN.mockReturnValue(false);
      KYCModel.validateGovID.mockReturnValue(true);
      KYCModel.validateAadhaar.mockReturnValue(true);
      KYCModel.validateDate.mockReturnValue(true);

      const response = await APIService.submitKYCData(mockKycData, mockCustomerId, mockMetadata);
      jest.runAllTimers();

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Invalid PAN format. PAN must be 10 alphanumeric characters.');
      expect(KYCModelDB.create).not.toHaveBeenCalled();
    });