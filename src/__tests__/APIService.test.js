const APIService = require('../../api/APIService');
const KYCModel = require('../../api/KYCModel');

// Mock KYCModel to control its behavior
jest.mock('../../api/KYCModel', () => ({
  create: jest.fn((data) => ({
    id: `kyc-${Math.random().toString(36).substring(7)}`,
    ...data,
    createdAt: new Date().toISOString(),
    encryptedData: 'encrypted-' + JSON.stringify(data), // Simulate encryption
  })),
  retrieve: jest.fn((record) => ({
    ...record,
    decryptedData: JSON.parse(record.encryptedData.replace('encrypted-', '')), // Simulate decryption
  })),
  update: jest.fn((record, updateData) => ({
    ...record,
    ...updateData,
    updatedAt: new Date().toISOString(),
    encryptedData: 'encrypted-' + JSON.stringify({ ...record, ...updateData }),
  })),
  validatePAN: jest.fn((pan) => pan && pan.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)),
  generatePANHash: jest.fn((pan) => `hash-${pan}`),
  validateGovID: jest.fn((govID) => govID && govID.length > 5), // Simple validation for mock
  validateAadhaar: jest.fn((aadhaar) => aadhaar && /^\d{12}$/.test(aadhaar)),
  validateDate: jest.fn((date) => !isNaN(new Date(date))),
}));

// Mock the in-memory databases for isolation
let mockKycDatabase = {};
let mockPanHashDatabase = {};

// Helper to reset the internal state of APIService for each test
const resetAPIServiceState = () => {
  APIService.__setKycDatabase(mockKycDatabase);
  APIService.__setPanHashDatabase(mockPanHashDatabase);
};

// Add a way to inject mock databases into APIService for testing
APIService.__setKycDatabase = (db) => {
  APIService.kycDatabase = db;
};
APIService.__setPanHashDatabase = (db) => {
  APIService.panHashDatabase = db;
};

describe('APIService', () => {
  beforeEach(() => {
    // Clear and reset mock databases before each test
    mockKycDatabase = {};
    mockPanHashDatabase = {};
    resetAPIServiceState();
    jest.clearAllMocks();
    jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn()); // Speed up network delays
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submitKYCData', () => {
    const validKycData = {
      govID: 'GOVID12345',
      kycAddress: '123 Main St',
      kycDob: '1990-01-01',
      pan: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
    };
    const customerId = 'cust123';
    const metadata = { ip: '192.168.1.1', userAgent: 'TestAgent' };

    test('should successfully submit valid KYC data', async () => {
      // Arrange
      KYCModel.validatePAN.mockReturnValue(true);
      KYCModel.validateGovID.mockReturnValue(true);
      KYCModel.validateAadhaar.mockReturnValue(true);
      KYCModel.validateDate.mockReturnValue(true);
      KYCModel.generatePANHash.mockReturnValue('hash-ABCDE1234F');

      // Act
      const response = await APIService.submitKYCData(validKycData, customerId, metadata);

      // Assert
      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.message).toBe('KYC data submitted successfully');
      expect(response.data).toHaveProperty('kycId');
      expect(response.data.customerId).toBe(customerId);
      expect(response.data.verificationStatus).toBe('pending');
      expect(KYCModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validKycData,
          customerId,
          submissionIP: metadata.ip,
          userAgent: metadata.userAgent,
        })
      );
      expect(mockKycDatabase).toHaveProperty(response.data.kycId);
      expect(mockPanHashDatabase).toHaveProperty('hash-ABCDE1234F');
    });

    test('should return 400 for missing required fields', async () => {
      // Arrange
      const invalidKycData = { ...validKycData, pan: undefined };

      // Act
      const response = await APIService.submitKYCData(invalidKycData, customerId, metadata);

      // Assert
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toContain('Missing required fields: pan');
      expect(KYCModel.create).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid PAN format', async () => {
      // Arrange
      KYCModel.validatePAN.mockReturnValue(false); // Simulate invalid PAN
      const invalidKycData = { ...validKycData, pan: 'INVALIDPAN' };

      // Act
      const response = await APIService.submitKYCData(invalidKycData, customerId, metadata);

      // Assert
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Invalid PAN format. PAN must be 10 alphanumeric characters.');
      expect(KYCModel.validatePAN).toHaveBeenCalledWith('INVALIDPAN');
      expect(KYCModel.create).not.toHaveBeenCalled();
    });

    test('should return 409 for duplicate PAN', async () => {
      // Arrange
      KYCModel.validatePAN.mockReturnValue(true);
      KYCModel.validateGovID.mockReturnValue(true);
      KYCModel.validateAadhaar.mockReturnValue(true);
      KYCModel.validateDate.mockReturnValue(true);
      KYCModel.generatePANHash.mockReturnValue('hash-ABCDE1234F');

      // Simulate PAN already existing
      mockPanHashDatabase['hash-ABCDE1234F'] = 'existing-kyc-id';
      resetAPIServiceState();

      // Act
      const response = await APIService.submitKYCData(validKycData, customerId, metadata);

      // Assert
      expect(response.success).toBe(false);
      expect(response.status).toBe(409);
      expect(response.message).toBe('PAN already exists in the system.');
      expect(KYCModel.create).not.toHaveBeenCalled();
    });