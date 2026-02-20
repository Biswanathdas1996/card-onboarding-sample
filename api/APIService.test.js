jest.mock('./KYCModel');

const APIService = require('./APIService');
const KYCModel = require('./KYCModel');

describe('APIService', () => {
  let kycDatabase = {};
  let panHashDatabase = {};

  beforeEach(() => {
    // Clear the in-memory databases before each test
    kycDatabase = {};
    panHashDatabase = {};

    // Reset mocks
    KYCModel.create.mockClear();
    KYCModel.validatePAN.mockClear();
    KYCModel.generatePANHash.mockClear();
    KYCModel.validateGovID.mockClear();
    KYCModel.validateAadhaar.mockClear();
    KYCModel.validateDate.mockClear();
    KYCModel.retrieve.mockClear();
  });

  describe('submitKYCData', () => {
    it('should submit KYC data successfully', async () => {
      const kycData = {
        govID: 'validGovID',
        kycAddress: 'validAddress',
        kycDob: '2000-01-01',
        pan: 'ABCDE1234F',
        aadhaarNumber: '123456789012'
      };
      const customerId = 'testCustomer';
      const metadata = { ip: '127.0.0.1', userAgent: 'Test Agent' };

      KYCModel.validatePAN.mockReturnValue(true);
      KYCModel.generatePANHash.mockReturnValue('panHash');
      KYCModel.validateGovID.mockReturnValue(true);
      KYCModel.validateAadhaar.mockReturnValue(true);
      KYCModel.validateDate.mockReturnValue(true);

      const kycRecord = {
        id: 'testKycId',
        ...kycData,
        customerId,
        submissionIP: metadata.ip,
        userAgent: metadata.userAgent,
        createdAt: new Date().toISOString()
      };

      KYCModel.create.mockReturnValue(kycRecord);

      const response = await APIService.submitKYCData(kycData, customerId, metadata);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.message).toBe('KYC data submitted successfully');
      expect(response.data.kycId).toBe('testKycId');
      expect(response.data.customerId).toBe(customerId);
      expect(response.data.verificationStatus).toBe('pending');
      expect(KYCModel.create).toHaveBeenCalledWith({
        ...kycData,
        customerId,
        submissionIP: metadata.ip,
        userAgent: metadata.userAgent
      });
    });

    it('should return an error if required fields are missing', async () => {
      const kycData = { pan: 'ABCDE1234F' }; // Missing required fields
      const response = await APIService.submitKYCData(kycData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toContain('Missing required fields');
    });
  });
});