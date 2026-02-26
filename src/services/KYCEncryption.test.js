const {
  encryptAadhaar,
  decryptAadhaar,
  generateAadhaarHash,
  isValidAadhaarFormat,
  getEncryptionKey
} = require('./KYCEncryption');
const crypto = require('crypto');

// Mock crypto.randomBytes to ensure consistent IV for testing
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('0123456789abcdef', 'utf8')), // 16 bytes IV
}));

describe('KYCEncryption Service', () => {
  const MOCK_AADHAAR = '123456789012';
  const MOCK_KEY_STRING = 'test-key-for-aadhaar-encryption-service';
  const MOCK_KEY_BUFFER = crypto.createHash('sha256').update(MOCK_KEY_STRING).digest();

  let originalAesKey;

  beforeAll(() => {
    originalAesKey = process.env.AES_KEY;
    process.env.AES_KEY = MOCK_KEY_STRING;
  });

  afterAll(() => {
    process.env.AES_KEY = originalAesKey;
  });

  describe('getEncryptionKey', () => {
    test('should return a 32-byte buffer when a string key is provided', () => {
      // Arrange
      const keyString = 'mysecretkey';
      // Act
      const key = getEncryptionKey(keyString);
      // Assert
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32);
    });

    test('should return the same 32-byte buffer when a 32-byte buffer is provided', () => {
      // Arrange
      const keyBuffer = crypto.randomBytes(32);
      // Act
      const key = getEncryptionKey(keyBuffer);
      // Assert
      expect(key).toEqual(keyBuffer);
    });

    test('should return a default 32-byte buffer if an invalid key type is provided', () => {
      // Arrange
      const invalidKey = 12345; // Not a string or buffer
      // Act
      const key = getEncryptionKey(invalidKey);
      // Assert
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32);
      // It should use the default AES_KEY from env
      const expectedDefaultKey = crypto.createHash('sha256').update(MOCK_KEY_STRING).digest();
      expect(key).toEqual(expectedDefaultKey);
    });

    test('should return a default 32-byte buffer if a buffer of incorrect length is provided', () => {
      // Arrange
      const shortBuffer = Buffer.from('short');
      // Act
      const key = getEncryptionKey(shortBuffer);
      // Assert
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32);
      const expectedDefaultKey = crypto.createHash('sha256').update(MOCK_KEY_STRING).digest();
      expect(key).toEqual(expectedDefaultKey);
    });

    test('should return a consistent key for the same string input', () => {
      // Arrange
      const keyString = 'consistentKey';
      // Act
      const key1 = getEncryptionKey(keyString);
      const key2 = getEncryptionKey(keyString);
      // Assert
      expect(key1).toEqual(key2);
    });
  });

  describe('encryptAadhaar', () => {
    test('should encrypt a valid Aadhaar number and return an object with encrypted data and IV', () => {
      // Arrange
      const aadhaar = MOCK_AADHAAR;
      // Act
      const result = encryptAadhaar(aadhaar);
      // Assert
      expect(result).toHaveProperty('aadhaar_encrypted');
      expect(typeof result.aadhaar_encrypted).toBe('string');
      expect(result.aadhaar_encrypted).not.toBe(aadhaar); // Should not be plain text

      expect(result).toHaveProperty('iv');
      expect(typeof result.iv).toBe('string');
      expect(result.iv).toBe(crypto.randomBytes(16).toString('base64')); // Check if mocked IV is used
    });

    test('should throw an error if Aadhaar number is null', () => {
      // Arrange
      const aadhaar = null;
      // Act & Assert
      expect(() => encryptAadhaar(aadhaar)).toThrow('Invalid Aadhaar number provided');
    });

    test('should throw an error if Aadhaar number is undefined', () => {
      // Arrange
      const aadhaar = undefined;
      // Act & Assert
      expect(() => encryptAadhaar(aadhaar)).toThrow('Invalid Aadhaar number provided');
    });

    test('should throw an error if Aadhaar number is an empty string', () => {
      // Arrange
      const aadhaar = '';
      // Act & Assert
      expect(() => encryptAadhaar(aadhaar)).toThrow('Invalid Aadhaar number provided');
    });

    test('should throw an error if Aadhaar number is not a string', () => {
      // Arrange
      const aadhaar = 123456789012;
      // Act & Assert
      expect(() => encryptAadhaar(aadhaar)).toThrow('Invalid Aadhaar number provided');
    });

    test('should throw an error if encryption fails internally', () => {
      // Arrange
      const aadhaar = MOCK_AADHAAR;
      // Temporarily mock createCipheriv to throw an error
      const originalCreateCipheriv = crypto.createCipheriv;
      crypto.createCipheriv = jest.fn(() => {
        throw new Error('Mock encryption failure');
      });

      // Act & Assert
      expect(() => encryptAadhaar(aadhaar)).toThrow('Failed to encrypt Aadhaar number');

      // Restore original function
      crypto.createCipheriv = originalCreateCipheriv;
    });
  });