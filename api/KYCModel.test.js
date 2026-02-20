const crypto = require('crypto');
jest.mock('crypto');

const {
  encryptData,
  decryptData,
  KYCModel
} = require('./KYCModel');

describe('KYCModel', () => {
  describe('Encryption', () => {
    test('encryptData should fallback to base64 encoding if encryption fails', () => {
      crypto.createCipheriv = jest.fn().mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const data = 'sensitive data';
      const encrypted = encryptData(data);
      const decoded = Buffer.from(encrypted, 'base64').toString('utf8');

      expect(encrypted).toBe(Buffer.from(data).toString('base64'));
      expect(decoded).toBe(data);
    });

    test('decryptData should handle base64-encoded data if no IV is present', () => {
      const base64Text = Buffer.from('base64 data').toString('base64');
      const decrypted = decryptData(base64Text);
      expect(decrypted).toBe('base64 data');
    });

    test('decryptData should return null if decryption fails', () => {
      crypto.createDecipheriv = jest.fn().mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedText = 'iv_value:encrypted_data';
      const decrypted = decryptData(encryptedText);
      expect(decrypted).toBeNull();
    });
  });

  describe('KYCModel.create', () => {
    test('should throw an error if invalid KYC data is provided', () => {
      expect(() => KYCModel.create(null)).toThrow('Invalid KYC data provided');
      expect(() => KYCModel.create('string')).toThrow('Invalid KYC data provided');
    });

    test('should throw an error if required fields are missing', () => {
      const data = { kycAddress: '123 Main St' };
      expect(() => KYCModel.create(data)).toThrow(
        'Missing required fields: govID, kycAddress, kycDob, pan'
      );
    });

    test('should handle optional fields correctly', () => {
      const data = {
        govID: 'gov123',
        kycAddress: '123 Main St',
        kycDob: '1990-01-01',
        pan: 'ABCDE1234F'
      };

      const kycRecord = KYCModel.create(data);

      expect(kycRecord.aadhaarNumber).toBeNull();
      expect(kycRecord.customerId).toBeNull();
      expect(kycRecord.metadata.submissionIP).toBeNull();
      expect(kycRecord.metadata.userAgent).toBeNull();
    });
  });
});