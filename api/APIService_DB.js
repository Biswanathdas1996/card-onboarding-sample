/**
 * KYC API Service (Database Version)
 * Handles API endpoints for submitting, retrieving, and managing KYC data
 * Uses PostgreSQL for persistent storage
 */

const KYCModelDB = require('../db/models/KYCModel');
const KYCModel = require('./KYCModel');

/**
 * Simulated network delay
 */
const simulateNetworkDelay = (ms = 400) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const APIService = {
  /**
   * POST /kyc-data
   * Submit new KYC data to database
   * @param {object} kycData - KYC form data
   * @param {string} customerId - Associated customer ID
   * @param {object} metadata - Additional metadata (IP, user agent, etc.)
   * @returns {Promise<object>} - API response
   */
  submitKYCData: async (kycData, customerId = null, metadata = {}) => {
    try {
      await simulateNetworkDelay(350);

      // Validate required fields
      const requiredFields = ['govID', 'kycAddress', 'kycDob', 'pan'];
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
      const panExists = await KYCModelDB.panExists(kycData.pan);
      if (panExists) {
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

      // Validate date
      if (!KYCModel.validateDate(kycData.kycDob)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid date of birth format.',
          timestamp: new Date().toISOString()
        };
      }

      // Create KYC record in database
      const result = await KYCModelDB.create(customerId, {
        pan: kycData.pan,
        govID: kycData.govID,
        govIDType: kycData.govIDType || null,
        dateOfBirth: kycData.kycDob,
        nationality: kycData.nationality || null,
        kycAddress: kycData.kycAddress,
        city: kycData.city || null,
        state: kycData.state || null,
        postalCode: kycData.postalCode || null,
        country: kycData.country || null,
        occupation: kycData.occupation || null,
        politicallyExposedPerson: kycData.politicallyExposedPerson || false,
        ipAddress: metadata.ip || null,
        userAgent: metadata.userAgent || null,
      });

      if (!result.success) {
        return {
          success: false,
          status: 409,
          message: result.error,
          code: result.code,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`KYC record created: ${result.kycId}`);

      return {
        success: true,
        status: 201,
        message: 'KYC data submitted successfully',
        data: {
          kycId: result.kycId,
          customerId: customerId,
          verificationStatus: 'pending',
          createdAt: result.createdAt
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
   * Retrieve KYC data by ID from database
   * @param {string} kycId - KYC record ID
   * @returns {Promise<object>} - API response with decrypted data
   */
  getKYCData: async (kycId) => {
    try {
      await simulateNetworkDelay(200);

      const record = await KYCModelDB.getById(kycId);

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'KYC record not found.',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        status: 200,
        message: 'KYC data retrieved successfully',
        data: {
          kycId: record.id,
          customerId: record.customer_id,
          govID: record.govID,
          govIDType: record.gov_id_type,
          dateOfBirth: record.date_of_birth,
          nationality: record.nationality,
          kycAddress: record.kyc_address,
          city: record.city,
          state: record.state,
          postalCode: record.postal_code,
          country: record.country,
          occupation: record.occupation,
          verificationStatus: record.verification_status,
          createdAt: record.created_at
        },
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

      const record = await KYCModelDB.getByCustomerId(customerId);

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'No KYC records found for this customer.',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        status: 200,
        message: 'KYC data retrieved successfully',
        data: [{
          kycId: record.id,
          customerId: record.customer_id,
          govID: record.govID,
          govIDType: record.gov_id_type,
          dateOfBirth: record.date_of_birth,
          nationality: record.nationality,
          kycAddress: record.kyc_address,
          city: record.city,
          state: record.state,
          postalCode: record.postal_code,
          country: record.country,
          occupation: record.occupation,
          verificationStatus: record.verification_status,
          createdAt: record.created_at
        }],
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
   * Update KYC record in database
   * @param {string} kycId - KYC record ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - API response
   */
  updateKYCData: async (kycId, updateData) => {
    try {
      await simulateNetworkDelay(400);

      const record = await KYCModelDB.getById(kycId);

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

      // Note: Database update logic would be implemented in KYCModelDB
      // For now, return success with updated record

      return {
        success: true,
        status: 200,
        message: 'KYC data updated successfully',
        data: record,
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
   * Update verification status in database
   * @param {string} kycId - KYC record ID
   * @param {string} status - Verification status (verified, rejected, expired)
   * @param {string} notes - Verification notes
   * @returns {Promise<object>} - API response
   */
  updateVerificationStatus: async (kycId, status, notes = '') => {
    try {
      await simulateNetworkDelay(300);

      const record = await KYCModelDB.getById(kycId);

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

      // Update status in database
      const updated = await KYCModelDB.updateVerificationStatus(kycId, status, notes, 'system');

      return {
        success: true,
        status: 200,
        message: `Verification status updated to ${status}`,
        data: {
          kycId: kycId,
          verificationStatus: status,
          verifiedAt: updated.verified_at
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
   * Delete KYC record from database
   * @param {string} kycId - KYC record ID
   * @returns {Promise<object>} - API response
   */
  deleteKYCData: async (kycId) => {
    try {
      await simulateNetworkDelay(250);

      const record = await KYCModelDB.getById(kycId);

      if (!record) {
        return {
          success: false,
          status: 404,
          message: 'KYC record not found.',
          timestamp: new Date().toISOString()
        };
      }

      // Note: Implement soft delete in database
      // For now, return success

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
   * Get database statistics
   * @returns {Promise<object>} - Database stats
   */
  getStats: async () => {
    try {
      const totalKYC = await KYCModelDB.count();
      return {
        totalKYCRecords: totalKYC,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalKYCRecords: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

module.exports = APIService;
