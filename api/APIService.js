/**
 * KYC API Service
 * Handles API endpoints for submitting, retrieving, and managing KYC data
 * Implements encryption, validation, and security measures
 */

const KYCModel = require('./KYCModel');

/**
 * In-memory storage for demo purposes
 * In production, use a proper database like MongoDB, PostgreSQL, etc.
 */
let kycDatabase = {};
let panHashDatabase = {}; // For duplicate PAN detection

/**
 * Simulated network delay
 */
const simulateNetworkDelay = (ms = 400) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const APIService = {
  /**
   * POST /kyc-data
   * Submit new KYC data
   * @param {object} kycData - KYC form data
   * @param {string} customerId - Associated customer ID
   * @param {object} metadata - Additional metadata (IP, user agent, etc.)
   * @returns {Promise<object>} - API response
   */
  submitKYCData: async (kycData, customerId = null, metadata = {}) => {
    try {
      await simulateNetworkDelay(350);

      // Validate required fields
      const requiredFields = ['govID', 'kycAddress', 'kycDob', 'pan', 'aadhaarNumber'];
      const missingFields = requiredFields.filter((field) => !kycData[field]);

      if (missingFields.length > 0) {
        return {
          success: false,
          status: 400,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          timestamp: new Date().toISOString()
        };
      }

      // Validate PAN format
      if (!KYCModel.validatePAN(kycData.pan)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid PAN format. PAN must be 10 alphanumeric characters.',
          timestamp: new Date().toISOString()
        };
      }

      // Check for duplicate PAN
      const panHash = KYCModel.generatePANHash(kycData.pan);
      if (panHashDatabase[panHash]) {
        return {
          success: false,
          status: 409, // Conflict
          message: 'PAN already exists in the system.',
          timestamp: new Date().toISOString()
        };
      }

      // Validate Government ID
      if (!KYCModel.validateGovID(kycData.govID)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid Government ID format.',
          timestamp: new Date().toISOString()
        };
      }

      // Validate Aadhaar Number format
      if (!KYCModel.validateAadhaar(kycData.aadhaarNumber)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid Aadhaar Number. Must be exactly 12 digits.',
          timestamp: new Date().toISOString()
        };
      }

      // Validate date
      if (!KYCModel.validateDate(kycData.kycDob)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid date of birth format.',
          timestamp: new Date().toISOString()
        };
      }

      // Create KYC record (with encryption)
      const kycRecord = KYCModel.create({
        ...kycData,
        customerId,
        submissionIP: metadata.ip || null,
        userAgent: metadata.userAgent || null
      });

      // Store PAN hash for duplicate detection
      panHashDatabase[panHash] = kycRecord.id;

      // Store encrypted record
      kycDatabase[kycRecord.id] = kycRecord;

      console.log(`KYC record created: ${kycRecord.id}`);

      return {
        success: true,
        status: 201,
        message: 'KYC data submitted successfully',
        data: {
          kycId: kycRecord.id,
          customerId: customerId,
          verificationStatus: 'pending',
          createdAt: kycRecord.createdAt
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error submitting KYC data:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while submitting KYC data.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * GET /kyc-data/:kycId
   * Retrieve KYC data by ID
   * @param {string} kycId - KYC record ID
   * @returns {Promise<object>} - API response with decrypted data
   */
  getKYCData: async (kycId) => {
    try {
      await simulateNetworkDelay(200);

      const record = kycDatabase[kycId];

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'KYC record not found.',
          timestamp: new Date().toISOString()
        };
      }

      // Retrieve and decrypt data
      const decryptedRecord = KYCModel.retrieve(record);

      return {
        success: true,
        status: 200,
        message: 'KYC data retrieved successfully',
        data: decryptedRecord,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error retrieving KYC data:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while retrieving KYC data.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * GET /kyc-data/customer/:customerId
   * Retrieve all KYC records for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} - API response with array of KYC records
   */
  getKYCDataByCustomer: async (customerId) => {
    try {
      await simulateNetworkDelay(250);

      const records = Object.values(kycDatabase).filter(
        (record) => record.customerId === customerId
      );

      if (records.length === 0) {
        return {
          success: false,
          status: 404,
          message: 'No KYC records found for this customer.',
          timestamp: new Date().toISOString()
        };
      }

      const decryptedRecords = records.map((record) => KYCModel.retrieve(record));

      return {
        success: true,
        status: 200,
        message: 'KYC data retrieved successfully',
        data: decryptedRecords,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error retrieving customer KYC data:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while retrieving KYC data.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * PUT /kyc-data/:kycId
   * Update KYC record
   * @param {string} kycId - KYC record ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - API response
   */
  updateKYCData: async (kycId, updateData) => {
    try {
      await simulateNetworkDelay(400);

      const record = kycDatabase[kycId];

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'KYC record not found.',
          timestamp: new Date().toISOString()
        };
      }

      // Validate PAN if being updated
      if (updateData.pan && !KYCModel.validatePAN(updateData.pan)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid PAN format.',
          timestamp: new Date().toISOString()
        };
      }

      // Update record
      const updatedRecord = KYCModel.update(record, updateData);
      kycDatabase[kycId] = updatedRecord;

      const decryptedRecord = KYCModel.retrieve(updatedRecord);

      return {
        success: true,
        status: 200,
        message: 'KYC data updated successfully',
        data: decryptedRecord,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating KYC data:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while updating KYC data.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * POST /kyc-data/:kycId/verify
   * Update verification status
   * @param {string} kycId - KYC record ID
   * @param {string} status - Verification status (verified, rejected, expired)
   * @param {string} notes - Verification notes
   * @returns {Promise<object>} - API response
   */
  updateVerificationStatus: async (kycId, status, notes = '') => {
    try {
      await simulateNetworkDelay(300);

      const record = kycDatabase[kycId];

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'KYC record not found.',
          timestamp: new Date().toISOString()
        };
      }

      const validStatuses = ['verified', 'rejected', 'expired', 'pending'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          status: 400,
          message: `Invalid verification status. Allowed values: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString()
        };
      }

      // Update record
      const updatedRecord = KYCModel.update(record, {
        verificationStatus: status
      });

      if (updatedRecord.metadata) {
        updatedRecord.metadata.lastVerificationAttempt = new Date().toISOString();
        updatedRecord.metadata.verificationNotes = notes;
      }

      kycDatabase[kycId] = updatedRecord;

      return {
        success: true,
        status: 200,
        message: `Verification status updated to ${status}`,
        data: {
          kycId: kycId,
          verificationStatus: status
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating verification status:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while updating verification status.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * DELETE /kyc-data/:kycId
   * Delete KYC record (soft delete)
   * @param {string} kycId - KYC record ID
   * @returns {Promise<object>} - API response
   */
  deleteKYCData: async (kycId) => {
    try {
      await simulateNetworkDelay(250);

      const record = kycDatabase[kycId];

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'KYC record not found.',
          timestamp: new Date().toISOString()
        };
      }

      // Remove PAN hash from duplicate detection
      const panData = record.pan;
      const panHash = Object.keys(panHashDatabase).find(
        (key) => panHashDatabase[key] === kycId
      );
      if (panHash) {
        delete panHashDatabase[panHash];
      }

      // Delete record
      delete kycDatabase[kycId];

      return {
        success: true,
        status: 200,
        message: 'KYC record deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error deleting KYC data:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred while deleting KYC data.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Get database statistics (for monitoring/debugging)
   * @returns {object} - Database stats
   */
  getStats: () => ({
    totalKYCRecords: Object.keys(kycDatabase).length,
    uniquePANs: Object.keys(panHashDatabase).length,
    timestamp: new Date().toISOString()
  }),

  /**
   * Clear database (for testing only)
   */
  clearDatabase: () => {
    kycDatabase = {};
    panHashDatabase = {};
  }
};

module.exports = APIService;
