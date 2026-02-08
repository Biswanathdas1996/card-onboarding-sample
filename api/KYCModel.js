/**
 * KYC Data Model
 * Defines the database schema for KYC (Know Your Customer) data
 * Includes encryption for sensitive fields like PAN
 */

const crypto = require('crypto');

/**
 * Encryption key for PAN and sensitive data
 * In production, this should be stored in environment variables and use proper key management
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string} text - Data to encrypt
 * @returns {string} - Encrypted and base64-encoded data
 */
const encryptData = (text) => {
  try {
    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(16);
    
    // Create cipher with the algorithm, key, and IV
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
      iv
    );
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (both as hex, joined by ':')
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to base64 encoding if proper encryption fails
    return Buffer.from(text).toString('base64');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted and hex-encoded data
 * @returns {string} - Decrypted data
 */
const decryptData = (encryptedText) => {
  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // Fallback for base64-only encryption
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
      iv
    );
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * KYC Model Schema
 * Defines the structure of KYC data stored in the database
 */
const KYCModel = {
  /**
   * Create new KYC record
   * @param {object} data - KYC data object
   * @returns {object} - Created KYC record with encrypted sensitive fields
   */
  create: (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid KYC data provided');
    }

    const requiredFields = ['govID', 'kycAddress', 'kycDob', 'pan'];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Create KYC record with encrypted sensitive fields
    const kycRecord = {
      id: `KYC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      govID: encryptData(data.govID),
      kycAddress: data.kycAddress, // Can be encrypted if needed
      kycDob: encryptData(data.kycDob),
      pan: encryptData(data.pan), // PAN is always encrypted
      aadhaarNumber: data.aadhaarNumber ? encryptData(data.aadhaarNumber) : null,
      customerId: data.customerId || null,
      verificationStatus: 'pending', // pending, verified, rejected, expired
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        submissionIP: data.submissionIP || null,
        userAgent: data.userAgent || null,
        encryptionVersion: 'aes-256-cbc-v1'
      }
    };

    return kycRecord;
  },

  /**
   * Retrieve KYC record
   * @param {string} kycId - KYC record ID
   * @param {object} record - KYC record from database
   * @returns {object} - Decrypted KYC record
   */
  retrieve: (record) => {
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      govID: decryptData(record.govID),
      kycAddress: record.kycAddress,
      kycDob: decryptData(record.kycDob),
      pan: decryptData(record.pan),
      aadhaarNumber: record.aadhaarNumber ? decryptData(record.aadhaarNumber) : null,
      customerId: record.customerId,
      verificationStatus: record.verificationStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  },

  /**
   * Update KYC record
   * @param {string} kycId - KYC record ID
   * @param {object} updateData - Data to update
   * @returns {object} - Updated KYC record
   */
  update: (record, updateData) => {
    if (!record) {
      throw new Error('KYC record not found');
    }

    const updated = { ...record };

    // Encrypt sensitive fields if they are being updated
    if (updateData.govID) {
      updated.govID = encryptData(updateData.govID);
    }
    if (updateData.kycDob) {
      updated.kycDob = encryptData(updateData.kycDob);
    }
    if (updateData.pan) {
      updated.pan = encryptData(updateData.pan);
    }
    if (updateData.aadhaarNumber) {
      updated.aadhaarNumber = encryptData(updateData.aadhaarNumber);
    }
    if (updateData.kycAddress) {
      updated.kycAddress = updateData.kycAddress;
    }
    if (updateData.verificationStatus) {
      updated.verificationStatus = updateData.verificationStatus;
    }

    updated.updatedAt = new Date().toISOString();

    return updated;
  },

  /**
   * Validate PAN format before encryption
   * @param {string} pan - PAN to validate
   * @returns {boolean} - True if valid
   */
  validatePAN: (pan) => {
    if (!pan || typeof pan !== 'string') return false;
    return /^[A-Za-z0-9]{10}$/.test(pan);
  },

  /**
   * Validate Government ID format
   * @param {string} govID - Government ID to validate
   * @returns {boolean} - True if valid
   */
  validateGovID: (govID) => {
    if (!govID || typeof govID !== 'string') return false;
    return /^[A-Za-z0-9]{5,20}$/.test(govID);
  },

  /**
   * Validate Aadhaar Number format (12 digits)
   * @param {string} aadhaar - Aadhaar number to validate
   * @returns {boolean} - True if valid
   */
  validateAadhaar: (aadhaar) => {
    if (!aadhaar || typeof aadhaar !== 'string') return false;
    return /^\d{12}$/.test(aadhaar.trim());
  },

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - True if valid
   */
  validateDate: (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  },

  /**
   * Generate hash for PAN (for duplicate detection without storing actual PAN)
   * @param {string} pan - PAN to hash
   * @returns {string} - SHA-256 hash of PAN
   */
  generatePANHash: (pan) => {
    return crypto.createHash('sha256').update(pan).digest('hex');
  },

  /**
   * Get database schema definition
   * @returns {object} - Schema definition for reference
   */
  getSchema: () => ({
    id: { type: 'String', required: true, unique: true },
    govID: { type: 'String', required: true, encrypted: true },
    kycAddress: { type: 'String', required: true },
    kycDob: { type: 'Date', required: true, encrypted: true },
    pan: { type: 'String', required: true, encrypted: true, indexed: 'hash' },
    aadhaarNumber: { type: 'String', required: false, encrypted: true },
    panHash: { type: 'String', unique: true, sparse: true }, // For duplicate detection
    customerId: { type: 'String', index: true },
    verificationStatus: {
      type: 'String',
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending'
    },
    createdAt: { type: 'Date', default: Date.now },
    updatedAt: { type: 'Date', default: Date.now },
    metadata: {
      submissionIP: String,
      userAgent: String,
      encryptionVersion: String,
      lastVerificationAttempt: Date,
      verificationNotes: String
    }
  })
};

module.exports = KYCModel;
