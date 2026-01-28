/**
 * Encryption Tests
 * Unit tests for KYC encryption/decryption functionality
 */

const {
  encryptAadhaar,
  decryptAadhaar,
  generateAadhaarHash,
  isValidAadhaarFormat
} = require('../src/services/KYCEncryption');

describe('KYC Encryption Service', () => {
  describe('Aadhaar Encryption and Decryption', () => {
    it('should encrypt and decrypt Aadhaar successfully', () => {
      const original = '123456789012';
      const { aadhaar_encrypted, iv } = encryptAadhaar(original);
      const decrypted = decryptAadhaar(aadhaar_encrypted, iv);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const aadhaar = '987654321098';
      const encryption1 = encryptAadhaar(aadhaar);
      const encryption2 = encryptAadhaar(aadhaar);

      // Different IVs should result in different ciphertexts
      expect(encryption1.aadhaar_encrypted).not.toBe(encryption2.aadhaar_encrypted);
      expect(encryption1.iv).not.toBe(encryption2.iv);

      // But both should decrypt to the same original value
      const decrypted1 = decryptAadhaar(encryption1.aadhaar_encrypted, encryption1.iv);
      const decrypted2 = decryptAadhaar(encryption2.aadhaar_encrypted, encryption2.iv);
      expect(decrypted1).toBe(aadhaar);
      expect(decrypted2).toBe(aadhaar);
    });

    it('should throw error when decrypting with wrong IV', () => {
      const original = '111111111111';
      const { aadhaar_encrypted, iv } = encryptAadhaar(original);
      const wrongIV = Buffer.from('wrong_iv_12345678').toString('base64');

      expect(() => {
        decryptAadhaar(aadhaar_encrypted, wrongIV);
      }).toThrow();
    });

    it('should throw error for invalid input to encryptAadhaar', () => {
      expect(() => {
        encryptAadhaar(null);
      }).toThrow('Invalid Aadhaar number provided');

      expect(() => {
        encryptAadhaar(undefined);
      }).toThrow('Invalid Aadhaar number provided');

      expect(() => {
        encryptAadhaar('');
      }).toThrow('Invalid Aadhaar number provided');
    });

    it('should throw error for invalid input to decryptAadhaar', () => {
      expect(() => {
        decryptAadhaar(null, 'someIV');
      }).toThrow('Invalid encrypted data or IV provided');

      expect(() => {
        decryptAadhaar('encrypted', null);
      }).toThrow('Invalid encrypted data or IV provided');
    });

    it('should handle various 12-digit Aadhaar numbers', () => {
      const testAadhaarNumbers = [
        '100000000001',
        '999999999999',
        '111111111111',
        '123456789012',
        '000000000000'
      ];

      testAadhaarNumbers.forEach((aadhaar) => {
        const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);
        const decrypted = decryptAadhaar(aadhaar_encrypted, iv);
        expect(decrypted).toBe(aadhaar);
      });
    });
  });

  describe('Aadhaar Hash Generation', () => {
    it('should generate consistent hash for same Aadhaar', () => {
      const aadhaar = '123456789012';
      const hash1 = generateAadhaarHash(aadhaar);
      const hash2 = generateAadhaarHash(aadhaar);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different Aadhaar numbers', () => {
      const hash1 = generateAadhaarHash('111111111111');
      const hash2 = generateAadhaarHash('222222222222');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate SHA-256 hash (64 hex characters)', () => {
      const hash = generateAadhaarHash('123456789012');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Aadhaar Format Validation', () => {
    it('should validate correct 12-digit Aadhaar format', () => {
      expect(isValidAadhaarFormat('123456789012')).toBe(true);
      expect(isValidAadhaarFormat('000000000000')).toBe(true);
      expect(isValidAadhaarFormat('999999999999')).toBe(true);
    });

    it('should reject non-12-digit Aadhaar numbers', () => {
      expect(isValidAadhaarFormat('12345678901')).toBe(false);   // 11 digits
      expect(isValidAadhaarFormat('1234567890123')).toBe(false); // 13 digits
      expect(isValidAadhaarFormat('abcd12345678')).toBe(false);  // Contains letters
      expect(isValidAadhaarFormat('12345678-012')).toBe(false);  // Contains special char
      expect(isValidAadhaarFormat('')).toBe(false);              // Empty string
    });

    it('should handle whitespace in Aadhaar validation', () => {
      expect(isValidAadhaarFormat(' 123456789012 ')).toBe(true); // Should trim
      expect(isValidAadhaarFormat('123456789012 ')).toBe(true);  // Trailing space
      expect(isValidAadhaarFormat(' 123456789012')).toBe(true);  // Leading space
    });

    it('should reject null and undefined', () => {
      expect(isValidAadhaarFormat(null)).toBe(false);
      expect(isValidAadhaarFormat(undefined)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should support full encryption-decryption workflow with hash', () => {
      const aadhaar = '987654321098';
      
      // Encrypt
      const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);
      
      // Generate hash for storage
      const hash = generateAadhaarHash(aadhaar);
      
      // Store encrypted data and hash in database
      const storedData = {
        aadhaar_encrypted,
        iv,
        hash
      };
      
      // Retrieve and decrypt
      const decrypted = decryptAadhaar(storedData.aadhaar_encrypted, storedData.iv);
      
      // Verify
      expect(decrypted).toBe(aadhaar);
      expect(generateAadhaarHash(decrypted)).toBe(hash);
    });

    it('should maintain data integrity across multiple encryption cycles', () => {
      const originalAadhaar = '555555555555';
      const cycles = 10;
      let currentAadhaar = originalAadhaar;

      for (let i = 0; i < cycles; i++) {
        const { aadhaar_encrypted, iv } = encryptAadhaar(currentAadhaar);
        currentAadhaar = decryptAadhaar(aadhaar_encrypted, iv);
      }

      expect(currentAadhaar).toBe(originalAadhaar);
    });
  });

  describe('Performance Tests', () => {
    it('should encrypt Aadhaar within acceptable time (< 50ms)', () => {
      const aadhaar = '123456789012';
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        encryptAadhaar(aadhaar);
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // 100 encryptions in under 5 seconds
    });

    it('should decrypt Aadhaar within acceptable time (< 50ms)', () => {
      const aadhaar = '123456789012';
      const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);
      
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        decryptAadhaar(aadhaar_encrypted, iv);
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // 100 decryptions in under 5 seconds
    });
  });
});
