jest.mock('../db/models/KYCModel');
jest.mock('./KYCModel');

const APIService = require('./APIService_DB');
const KYCModelDB = require('../db/models/KYCModel');
const KYCModel = require('./KYCModel');

describe('APIService', () => {
  describe('submitKYCData', () => {
    test('should return success false with status 400 if missing required fields', async () => {
      const kycData = {};
      const result = await APIService.submitKYCData(kycData);
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toContain('Missing required fields');
    });
  });
});