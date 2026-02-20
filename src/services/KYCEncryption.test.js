/**
 * @jest-environment node
 */
const crypto = require('crypto');

jest.mock('crypto');

const {
  encryptAadhaar,
  decryptAadhaar,
  generateAadhaarHash,
  isValidAadhaarFormat,
  getEncryptionKey
} = require('./KYCEncryption');

describe('KYCEncryption Service', () => {
  describe('getEncryptionKey', () => {
    it('should return a 32-byte buffer when a string key is provided', () => {
      const key = 'test-encryption-key';
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });
      const result = getEncryptionKey(key);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(32);
    });

    it('should return the key when a 32-byte buffer is provided', () => {
      const key = Buffer.alloc(32, '1');
      const result = getEncryptionKey(key);
      expect(result).toBe(key);
    });

    it('should return a default 32-byte buffer when no key is provided', () => {
      process.env.AES_KEY = undefined;
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });
      const result = getEncryptionKey(undefined);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(32);
    });

    it('should return a default 32-byte buffer when an invalid key is provided', () => {
      const key = Buffer.alloc(16, '1');
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });
      const result = getEncryptionKey(key);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(32);
    });
  });

  describe('encryptAadhaar', () => {
    it('should encrypt Aadhaar number and return encrypted data and IV', () => {
      const aadhaar = '123456789012';
      const mockIv = Buffer.from('mockIv');
      crypto.randomBytes.mockReturnValue(mockIv);
      crypto.createCipheriv.mockReturnValue({
        update: jest.fn().mockReturnValue('encrypted_data'),
        final: jest.fn().mockReturnValue('encrypted_data_final'),
      });
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });

      const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);

      expect(aadhaar_encrypted).toBe('encrypted_dataencrypted_data_final');
      expect(iv).toBe(mockIv.toString('base64'));
    });

    it('should throw an error if Aadhaar number is invalid', () => {
      expect(() => encryptAadhaar(null)).toThrow('Invalid Aadhaar number provided');
      expect(() => encryptAadhaar(123)).toThrow('Invalid Aadhaar number provided');
    });

    it('should handle encryption errors and throw a generic error', () => {
      const aadhaar = '123456789012';
      crypto.randomBytes.mockImplementation(() => {
        throw new Error('Encryption failed');
      });
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });

      expect(() => encryptAadhaar(aadhaar)).toThrow('Failed to encrypt Aadhaar number');
    });
  });

  describe('decryptAadhaar', () => {
    it('should decrypt Aadhaar number and return decrypted data', () => {
      const aadhaarEncrypted = 'encrypted_data';
      const ivBase64 = 'base64_iv';
      const mockIv = Buffer.from(ivBase64, 'base64');

      crypto.createDecipheriv.mockReturnValue({
        update: jest.fn().mockReturnValue('decrypted_data'),
        final: jest.fn().mockReturnValue('decrypted_data_final'),
      });
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });

      const decrypted = decryptAadhaar(aadhaarEncrypted, ivBase64);

      expect(decrypted).toBe('decrypted_datadecrypted_data_final');
    });

    it('should throw an error if encrypted data or IV is invalid', () => {
      expect(() => decryptAadhaar(null, 'iv')).toThrow('Invalid encrypted data or IV provided');
      expect(() => decryptAadhaar('encrypted', null)).toThrow('Invalid encrypted data or IV provided');
    });

    it('should handle decryption errors and throw a generic error', () => {
      const aadhaarEncrypted = 'encrypted_data';
      const ivBase64 = 'base64_iv';

      crypto.createDecipheriv.mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.alloc(32, '0'))
      });

      expect(() => decryptAadhaar(aadhaarEncrypted, ivBase64)).toThrow('Failed to decrypt Aadhaar number');
    });
  });

  describe('generateAadhaarHash', () => {
    it('should generate SHA-256 hash of Aadhaar number', () => {
      const aadhaar = '123456789012';
      const mockHash = 'mocked_hash';
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(mockHash),
      });

      const hash = generateAadhaarHash(aadhaar);

      expect(hash).toBe(mockHash);
    });
  });

  describe('isValidAadhaarFormat', () => {
    it('should return true for a valid Aadhaar number format', () => {
      expect(isValidAadhaarFormat('123456789012')).toBe(true);
    });

    it('should return false for an invalid Aadhaar number format', () => {
      expect(isValidAadhaarFormat('12345678901')).toBe(false);
      expect(isValidAadhaarFormat('1234567890123')).toBe(false);
      expect(isValidAadhaarFormat('12345678901a')).toBe(false);
      expect(isValidAadhaarFormat(123456789012)).toBe(true); // Coerce number to string
    });
  });
});