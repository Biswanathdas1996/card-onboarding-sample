/**
 * KYC Encryption Service
 * Handles AES-256 encryption and decryption for sensitive KYC data (Aadhaar Numbers)
 */

const crypto = require('crypto');

// Get encryption key from environment variable
const AES_KEY = process.env.AES_KEY || Buffer.from('0'.repeat(64), 'hex'); // 32 bytes for AES-256
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Validate and normalize the encryption key
 * @param {string|Buffer} key - The encryption key
 * @returns {Buffer} - A valid 32-byte buffer for AES-256
 */
const getEncryptionKey = (key) => {
  if (typeof key === 'string') {
    // If string, hash it to get a consistent 32-byte key
    return crypto.createHash('sha256').update(key).digest();
  }
  if (Buffer.isBuffer(key) && key.length === 32) {
    return key;
  }
  // Default fallback key
  return crypto.createHash('sha256').update(AES_KEY).digest();
};

/**
 * Encrypt Aadhaar Number using AES-256-CBC
 * @param {string} aadhaar - The Aadhaar number to encrypt
 * @returns {object} - Object containing encrypted data and IV
 * @example
 * const { aadhaar_encrypted, iv } = encryptAadhaar('123456789012');
 */
const encryptAadhaar = (aadhaar) => {
  try {
    if (!aadhaar || typeof aadhaar !== 'string') {
      throw new Error('Invalid Aadhaar number provided');
    }

    const key = getEncryptionKey(AES_KEY);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(aadhaar, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
      aadhaar_encrypted: encrypted,
      iv: iv.toString('base64')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt Aadhaar number');
  }
};

/**
 * Decrypt Aadhaar Number
 * @param {string} aadhaarEncrypted - The encrypted Aadhaar number
 * @param {string} ivBase64 - The IV in base64 format
 * @returns {string} - The decrypted Aadhaar number
 * @example
 * const decrypted = decryptAadhaar(encryptedData, ivString);
 */
const decryptAadhaar = (aadhaarEncrypted, ivBase64) => {
  try {
    if (!aadhaarEncrypted || !ivBase64) {
      throw new Error('Invalid encrypted data or IV provided');
    }

    const key = getEncryptionKey(AES_KEY);
    const iv = Buffer.from(ivBase64, 'base64');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let decrypted = decipher.update(aadhaarEncrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt Aadhaar number');
  }
};

/**
 * Generate hash of Aadhaar for duplicate detection and validation
 * @param {string} aadhaar - The Aadhaar number
 * @returns {string} - SHA-256 hash of Aadhaar
 */
const generateAadhaarHash = (aadhaar) => {
  return crypto.createHash('sha256').update(aadhaar).digest('hex');
};

/**
 * Validate Aadhaar number format (must be 12 digits)
 * @param {string} aadhaar - The Aadhaar number to validate
 * @returns {boolean} - True if valid Aadhaar format
 */
const isValidAadhaarFormat = (aadhaar) => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(String(aadhaar).trim());
};

module.exports = {
  encryptAadhaar,
  decryptAadhaar,
  generateAadhaarHash,
  isValidAadhaarFormat,
  getEncryptionKey
};
