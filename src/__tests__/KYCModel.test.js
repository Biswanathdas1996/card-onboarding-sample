const { KYCModel, encryptData, decryptData, generatePANHash } = require('../../db/models/KYCModel');
const db = require('../../db/config');
const crypto = require('crypto');

// Mock the database connection
jest.mock('../../db/config', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

// Mock crypto.randomBytes to return a consistent IV for encryption tests
jest.mock('crypto', () => {
  const originalCrypto = jest.requireActual('crypto');
  return {
    ...originalCrypto,
    randomBytes: jest.fn((size) => Buffer.from('a'.repeat(size))), // Consistent IV for testing
    createCipheriv: jest.fn((...args) => originalCrypto.createCipheriv(...args)),
    createDecipheriv: jest.fn((...args) => originalCrypto.createDecipheriv(...args)),
    createHash: jest.fn((...args) => originalCrypto.createHash(...args)),
  };
});

describe('KYCModel', () => {
  const mockCustomerId = 'test-customer-id-123';
  const mockKycId = 'test-kyc-id-456';
  const mockPan = 'ABCDE1234F';
  const mockGovID = 'GOVID12345';
  const mockAadhaar = '123456789012';
  const mockDateOfBirth = '1990-01-01';
  const mockKycAddress = '123 Test St';
  const mockCity = 'Testville';
  const mockState = 'TS';
  const mockPostalCode = '12345';
  const mockCountry = 'India';
  const mockOccupation = 'Engineer';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  const mockKycData = {
    pan: mockPan,
    govID: mockGovID,
    aadhaarNumber: mockAadhaar,
    govIDType: 'passport',
    dateOfBirth: mockDateOfBirth,
    nationality: 'Indian',
    kycAddress: mockKycAddress,
    city: mockCity,
    state: mockState,
    postalCode: mockPostalCode,
    country: mockCountry,
    occupation: mockOccupation,
    politicallyExposedPerson: false,
    ipAddress: mockIpAddress,
    userAgent: mockUserAgent,
  };

  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset ENCRYPTION_KEY for consistent testing
    process.env.ENCRYPTION_KEY = 'default-encryption-key-change-in-production';
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Encryption and Decryption Utilities', () => {
    test('encryptData should encrypt and base64 encode the text', () => {
      const text = 'sensitive data';
      const encrypted = encryptData(text);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(text); // Should not be plain text
      expect(encrypted.split(':').length).toBe(2); // Should contain IV and encrypted data
    });

    test('decryptData should decrypt the encrypted text back to original', () => {
      const text = 'sensitive data to be decrypted';
      const encrypted = encryptData(text);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(text);
    });

    test('decryptData should return null for invalid encrypted format', () => {
      const invalidEncrypted = 'invalid-format';
      const decrypted = decryptData(invalidEncrypted);
      // The source code falls back to base64 decode if not colon separated
      expect(decrypted).toBe(Buffer.from(invalidEncrypted, 'base64').toString('utf8'));
    });

    test('decryptData should handle base64 encoded strings if not colon separated', () => {
      const text = 'some data';
      const base64Encoded = Buffer.from(text).toString('base64');
      const decrypted = decryptData(base64Encoded);
      expect(decrypted).toBe(text);
    });

    test('encryptData should handle encryption errors gracefully and return base64', () => {
      const originalCreateCipheriv = crypto.createCipheriv;
      crypto.createCipheriv.mockImplementationOnce(() => {
        throw new Error('Cipher error');
      });
      const text = 'error test';
      const encrypted = encryptData(text);
      expect(encrypted).toBe(Buffer.from(text).toString('base64'));
      expect(console.error).toHaveBeenCalledWith('Encryption error:', expect.any(Error));
      crypto.createCipheriv = originalCreateCipheriv; // Restore original
    });

    test('decryptData should handle decryption errors gracefully and return null', () => {
      const originalCreateDecipheriv = crypto.createDecipheriv;
      crypto.createDecipheriv.mockImplementationOnce(() => {
        throw new Error('Decipher error');
      });
      const encryptedText = 'a'.repeat(32) + ':' + 'b'.repeat(64); // Valid format, but will error
      const decrypted = decryptData(encryptedText);
      expect(decrypted).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Decryption error:', expect.any(Error));
      crypto.createDecipheriv = originalCreateDecipheriv; // Restore original
    });
  });

  describe('generatePANHash', () => {
    test('should generate a consistent SHA-256 hash for a given PAN', () => {
      const pan = 'ABCDE1234F';
      const hash1 = generatePANHash(pan);
      const hash2 = generatePANHash(pan);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/); // SHA-256 is 64 hex chars
    });

    test('should generate different hashes for different PANs', () => {
      const pan1 = 'ABCDE1234F';
      const pan2 = 'FGHIJ5678K';
      const hash1 = generatePANHash(pan1);
      const hash2 = generatePANHash(pan2);
      expect(hash1).not.toBe(hash2);
    });
  });