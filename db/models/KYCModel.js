/**
 * KYC Model
 * Database operations for KYC submissions
 */

const db = require('../config');
const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string} text - Data to encrypt
 * @returns {string} - Encrypted and base64-encoded data
 */
const encryptData = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return Buffer.from(text).toString('base64');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted data
 * @returns {string} - Decrypted data
 */
const decryptData = (encryptedText) => {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Generate hash of PAN for duplicate detection
 * @param {string} pan - PAN number
 * @returns {string} - SHA-256 hash of PAN
 */
const generatePANHash = (pan) => {
  return crypto.createHash('sha256').update(pan).digest('hex');
};

const KYCModel = {
  /**
   * Create a new KYC submission
   * @param {string} customerId - Customer UUID
   * @param {object} kycData - KYC form data
   * @returns {Promise<object>} - Created KYC record
   */
  create: async (customerId, kycData) => {
    try {
      let {
        pan,
        govID,
        govIDType,
        dateOfBirth,
        nationality,
        kycAddress,
        city,
        state,
        postalCode,
        country,
        occupation,
        politicallyExposedPerson,
        ipAddress,
        userAgent,
      } = kycData;

      // Truncate fields to database limits to prevent VARCHAR errors
      govIDType = (govIDType || 'passport').substring(0, 50);
      nationality = (nationality || '').substring(0, 100);
      city = (city || '').substring(0, 100);
      state = (state || '').substring(0, 100);
      postalCode = (postalCode || '').substring(0, 20);
      country = (country || '').substring(0, 100);
      occupation = (occupation || '').substring(0, 100);
      userAgent = (userAgent || '').substring(0, 500);

      // Encrypt sensitive fields
      const encryptedPAN = encryptData(pan);
      const encryptedGovID = encryptData(govID);

      // Generate PAN hash for duplicate detection
      const panHash = generatePANHash(pan);

      const query = `
        INSERT INTO kyc_submissions (
          customer_id, pan, gov_id, gov_id_type, date_of_birth, nationality,
          kyc_address, city, state, postal_code, country, occupation,
          politically_exposed_person, ip_address, user_agent, submission_source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, created_at;
      `;

      const result = await db.queryOne(query, [
        customerId,
        encryptedPAN,
        encryptedGovID,
        govIDType || null,
        dateOfBirth || null,
        nationality || null,
        kycAddress,
        city || null,
        state || null,
        postalCode || null,
        country || null,
        occupation || null,
        politicallyExposedPerson || false,
        ipAddress || null,
        userAgent || null,
        'web-form',
      ]);

      // Store PAN hash for duplicate detection
      const hashQuery = `
        INSERT INTO pan_hashes (pan_hash, kyc_id)
        VALUES ($1, $2);
      `;
      await db.query(hashQuery, [panHash, result.id]);

      return {
        success: true,
        kycId: result.id,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('KYC creation error:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'PAN already exists in the system',
          code: 'DUPLICATE_PAN',
        };
      }
      throw error;
    }
  },

  /**
   * Get KYC by ID
   * @param {string} kycId - KYC UUID
   * @returns {Promise<object>} - KYC record with decrypted sensitive data
   */
  getById: async (kycId) => {
    try {
      const query = `
        SELECT id, customer_id, pan, gov_id, gov_id_type, date_of_birth, nationality,
               kyc_address, city, state, postal_code, country, occupation,
               politically_exposed_person, document_url, verification_status,
               verification_notes, verified_by, verified_at, created_at, updated_at
        FROM kyc_submissions
        WHERE id = $1;
      `;

      const result = await db.queryOne(query, [kycId]);
      if (result) {
        // Decrypt sensitive fields
        result.pan = decryptData(result.pan);
        result.govID = decryptData(result.gov_id);
        delete result.gov_id; // Remove encrypted field
      }
      return result;
    } catch (error) {
      console.error('Get KYC error:', error);
      throw error;
    }
  },

  /**
   * Get KYC by customer ID
   * @param {string} customerId - Customer UUID
   * @returns {Promise<object>} - KYC record
   */
  getByCustomerId: async (customerId) => {
    try {
      const query = `
        SELECT id, customer_id, pan, gov_id, gov_id_type, date_of_birth, nationality,
               kyc_address, city, state, postal_code, country, occupation,
               politically_exposed_person, document_url, verification_status,
               verification_notes, verified_by, verified_at, created_at, updated_at
        FROM kyc_submissions
        WHERE customer_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;

      const result = await db.queryOne(query, [customerId]);
      if (result) {
        result.pan = decryptData(result.pan);
        result.govID = decryptData(result.gov_id);
        delete result.gov_id;
      }
      return result;
    } catch (error) {
      console.error('Get KYC by customer error:', error);
      throw error;
    }
  },

  /**
   * Check if PAN already exists
   * @param {string} pan - PAN number
   * @returns {Promise<boolean>} - True if PAN exists
   */
  panExists: async (pan) => {
    try {
      const panHash = generatePANHash(pan);
      const query = `
        SELECT id FROM pan_hashes
        WHERE pan_hash = $1
        LIMIT 1;
      `;

      const result = await db.queryOne(query, [panHash]);
      return !!result;
    } catch (error) {
      console.error('Check PAN exists error:', error);
      throw error;
    }
  },

  /**
   * Update KYC verification status
   * @param {string} kycId - KYC UUID
   * @param {string} status - New status (pending, verified, rejected)
   * @param {string} notes - Verification notes
   * @param {string} verifiedBy - User who verified
   * @returns {Promise<object>} - Updated KYC record
   */
  updateVerificationStatus: async (kycId, status, notes = null, verifiedBy = null) => {
    try {
      const query = `
        UPDATE kyc_submissions
        SET verification_status = $1,
            verification_notes = $2,
            verified_by = $3,
            verified_at = CASE WHEN $1 = 'verified' THEN CURRENT_TIMESTAMP ELSE verified_at END
        WHERE id = $4
        RETURNING id, verification_status, verified_at;
      `;

      return await db.queryOne(query, [status, notes, verifiedBy, kycId]);
    } catch (error) {
      console.error('Update KYC status error:', error);
      throw error;
    }
  },

  /**
   * Update risk assessment
   * @param {string} kycId - KYC UUID
   * @param {string} riskLevel - Risk level (low, medium, high)
   * @returns {Promise<object>} - Updated KYC record
   */
  updateRiskAssessment: async (kycId, riskLevel) => {
    try {
      const query = `
        UPDATE kyc_submissions
        SET risk_assessment = $1
        WHERE id = $2
        RETURNING id, risk_assessment;
      `;

      return await db.queryOne(query, [riskLevel, kycId]);
    } catch (error) {
      console.error('Update risk assessment error:', error);
      throw error;
    }
  },

  /**
   * Get all KYC submissions (paginated)
   * @param {number} limit - Records per page
   * @param {number} offset - Pagination offset
   * @param {string} status - Filter by verification status
   * @returns {Promise<array>} - Array of KYC records
   */
  getAll: async (limit = 20, offset = 0, status = null) => {
    try {
      const statusFilter = status ? 'AND verification_status = $3' : '';
      const query = `
        SELECT id, customer_id, gov_id_type, date_of_birth, nationality,
               city, state, country, politically_exposed_person,
               verification_status, risk_assessment, created_at, updated_at
        FROM kyc_submissions
        WHERE 1=1 ${statusFilter}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      const params = status ? [limit, offset, status] : [limit, offset];
      return await db.queryAll(query, params);
    } catch (error) {
      console.error('Get all KYC error:', error);
      throw error;
    }
  },

  /**
   * Count KYC submissions
   * @param {string} status - Filter by status
   * @returns {Promise<number>} - Total count
   */
  count: async (status = null) => {
    try {
      const statusFilter = status ? 'AND verification_status = $1' : '';
      const query = `
        SELECT COUNT(*) as count FROM kyc_submissions
        WHERE 1=1 ${statusFilter};
      `;

      const params = status ? [status] : [];
      const result = await db.queryOne(query, params);
      return parseInt(result.count, 10);
    } catch (error) {
      console.error('Count KYC error:', error);
      throw error;
    }
  },
};

module.exports = KYCModel;
