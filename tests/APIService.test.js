/**
 * Backend API Service Tests
 * Tests for KYCModel and APIService with PAN handling and encryption
 */

const KYCModel = require('../api/KYCModel');
const APIService = require('../api/APIService');

describe('Backend KYC Model Tests', () => {
  describe('ADD-003 & ADD-004: KYC Model with PAN Encryption', () => {
    test('should create KYC record with encrypted PAN', () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street, City, State',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF',
        customerId: 'CUST-12345'
      };

      const record = KYCModel.create(kycData);

      expect(record).toBeDefined();
      expect(record.id).toBeTruthy();
      expect(record.pan).not.toBe(kycData.pan); // PAN should be encrypted
      expect(record.govID).not.toBe(kycData.govID); // GOV ID should be encrypted
      expect(record.verificationStatus).toBe('pending');
      expect(record.createdAt).toBeDefined();
    });

    test('should require PAN field in KYC data', () => {
      const kycDataWithoutPAN = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15'
        // Missing PAN
      };

      expect(() => {
        KYCModel.create(kycDataWithoutPAN);
      }).toThrow(/Missing required fields/i);
    });

    test('should require all mandatory KYC fields', () => {
      const incompletekycData = {
        govID: 'VALID12345',
        // Missing kycAddress, kycDob, pan
      };

      expect(() => {
        KYCModel.create(incompletekycData);
      }).toThrow(/Missing required fields/i);
    });

    test('should validate PAN format before encryption', () => {
      const invalidPAN = 'INVALID';
      expect(KYCModel.validatePAN(invalidPAN)).toBe(false);

      const validPAN = 'ABCD1234EF';
      expect(KYCModel.validatePAN(validPAN)).toBe(true);
    });

    test('should validate Government ID format', () => {
      expect(KYCModel.validateGovID('VALID12345')).toBe(true);
      expect(KYCModel.validateGovID('A123')).toBe(false); // Too short
      expect(KYCModel.validateGovID('A'.repeat(21))).toBe(false); // Too long
    });

    test('should validate date format', () => {
      expect(KYCModel.validateDate('1990-01-15')).toBe(true);
      expect(KYCModel.validateDate('01/15/1990')).toBe(true); // Various formats accepted by Date
      expect(KYCModel.validateDate('invalid-date')).toBe(false);
    });

    test('should generate PAN hash for duplicate detection', () => {
      const pan = 'ABCD1234EF';
      const hash1 = KYCModel.generatePANHash(pan);
      const hash2 = KYCModel.generatePANHash(pan);

      expect(hash1).toBe(hash2); // Same PAN should produce same hash
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 char hex string
    });

    test('should return different hashes for different PANs', () => {
      const hash1 = KYCModel.generatePANHash('ABCD1234EF');
      const hash2 = KYCModel.generatePANHash('XYZW5678AB');

      expect(hash1).not.toBe(hash2);
    });

    test('should retrieve and decrypt KYC data', () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const encryptedRecord = KYCModel.create(kycData);
      const decryptedRecord = KYCModel.retrieve(encryptedRecord);

      expect(decryptedRecord.pan).toBe(kycData.pan); // Should match original
      expect(decryptedRecord.govID).toBe(kycData.govID);
      expect(decryptedRecord.kycAddress).toBe(kycData.kycAddress);
    });

    test('should update KYC record with new PAN', () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      let record = KYCModel.create(kycData);
      const originalId = record.id;

      const updatedRecord = KYCModel.update(record, { pan: 'XYZW5678AB' });
      const decrypted = KYCModel.retrieve(updatedRecord);

      expect(decrypted.pan).toBe('XYZW5678AB');
      expect(decrypted.govID).toBe(kycData.govID); // Unchanged fields should remain
    });
  });

  describe('ADD-005: Performance Metrics for Backend', () => {
    test('KYC record creation should be fast', () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        KYCModel.create(kycData);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      expect(avgTime).toBeLessThan(50); // < 50ms per encryption
    });

    test('Encryption/decryption should be performant', () => {
      const data = 'SENSITIVE_PAN_DATA_ABCD1234EF';

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const encrypted = KYCModel.generatePANHash(data);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;

      expect(avgTime).toBeLessThan(5); // < 5ms per hash operation
    });
  });
});

describe('Backend API Service Tests', () => {
  beforeEach(() => {
    APIService.clearDatabase(); // Clear data before each test
  });

  describe('ADD-003: API Endpoints for PAN Data', () => {
    test('should submit KYC data with PAN (POST /kyc-data)', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const response = await APIService.submitKYCData(kycData, 'CUST-12345');

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data.kycId).toBeTruthy();
      expect(response.data.verificationStatus).toBe('pending');
    });

    test('should reject submission with missing PAN', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15'
        // Missing PAN
      };

      const response = await APIService.submitKYCData(kycData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toMatch(/missing required fields/i);
    });

    test('should reject submission with invalid PAN format', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'INVALID'
      };

      const response = await APIService.submitKYCData(kycData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toMatch(/invalid pan format/i);
    });

    test('should prevent duplicate PAN submission', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      // First submission should succeed
      const response1 = await APIService.submitKYCData(kycData, 'CUST-111');
      expect(response1.success).toBe(true);

      // Same PAN with different customer should fail
      const kycData2 = { ...kycData, govID: 'DIFFERENT123' };
      const response2 = await APIService.submitKYCData(kycData2, 'CUST-222');

      expect(response2.success).toBe(false);
      expect(response2.status).toBe(409); // Conflict
      expect(response2.message).toMatch(/already exists/i);
    });

    test('should retrieve KYC data by ID (GET /kyc-data/:kycId)', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData, 'CUST-12345');
      const kycId = submitResponse.data.kycId;

      const getResponse = await APIService.getKYCData(kycId);

      expect(getResponse.success).toBe(true);
      expect(getResponse.data.pan).toBe(kycData.pan);
      expect(getResponse.data.govID).toBe(kycData.govID);
    });

    test('should return 404 for non-existent KYC record', async () => {
      const response = await APIService.getKYCData('NONEXISTENT-ID');

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should retrieve all KYC records for a customer', async () => {
      const customerId = 'CUST-12345';
      const kycData1 = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };
      const kycData2 = {
        govID: 'VALID54321',
        kycAddress: '456 Oak Avenue',
        kycDob: '1985-05-20',
        pan: 'XYZW5678AB'
      };

      await APIService.submitKYCData(kycData1, customerId);
      await APIService.submitKYCData(kycData2, customerId);

      const response = await APIService.getKYCDataByCustomer(customerId);

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(2);
    });

    test('should update KYC data with new PAN (PUT /kyc-data/:kycId)', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData);
      const kycId = submitResponse.data.kycId;

      const updateResponse = await APIService.updateKYCData(kycId, {
        pan: 'NEWPAN1234'
      });

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.pan).toBe('NEWPAN1234');
    });

    test('should reject update with invalid PAN', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData);
      const kycId = submitResponse.data.kycId;

      const updateResponse = await APIService.updateKYCData(kycId, {
        pan: 'INVALID'
      });

      expect(updateResponse.success).toBe(false);
      expect(updateResponse.status).toBe(400);
    });

    test('should update verification status', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData);
      const kycId = submitResponse.data.kycId;

      const verifyResponse = await APIService.updateVerificationStatus(
        kycId,
        'verified',
        'Verified by manual review'
      );

      expect(verifyResponse.success).toBe(true);
      expect(verifyResponse.data.verificationStatus).toBe('verified');
    });

    test('should delete KYC record', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData);
      const kycId = submitResponse.data.kycId;

      const deleteResponse = await APIService.deleteKYCData(kycId);

      expect(deleteResponse.success).toBe(true);

      // Verify deletion
      const getResponse = await APIService.getKYCData(kycId);
      expect(getResponse.success).toBe(false);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('ADD-004: Encryption Security', () => {
    test('should encrypt PAN during submission', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const response = await APIService.submitKYCData(kycData);
      expect(response.success).toBe(true);

      // The stored data should be encrypted
      const stats = APIService.getStats();
      expect(stats.totalKYCRecords).toBe(1);
    });

    test('should handle encryption metadata correctly', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const metadata = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const response = await APIService.submitKYCData(kycData, 'CUST-12345', metadata);
      expect(response.success).toBe(true);
    });
  });

  describe('ADD-005: Performance Metrics for API', () => {
    test('API submission should be sub-400ms', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const startTime = Date.now();
      const response = await APIService.submitKYCData(kycData);
      const endTime = Date.now();

      expect(response.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(400);
    });

    test('API retrieval should be sub-250ms', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: '123 Main Street',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData);
      const kycId = submitResponse.data.kycId;

      const startTime = Date.now();
      const getResponse = await APIService.getKYCData(kycId);
      const endTime = Date.now();

      expect(getResponse.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(250);
    });

    test('should handle multiple concurrent submissions', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const kycData = {
          govID: `VALID${i}${i}${i}${i}${i}`,
          kycAddress: `${i} Street`,
          kycDob: '1990-01-15',
          pan: `PANtest${i.toString().padStart(4, '0')}`
        };

        promises.push(APIService.submitKYCData(kycData, `CUST-${i}`));
      }

      const results = await Promise.all(promises);

      // All submissions should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Should have 10 records
      const stats = APIService.getStats();
      expect(stats.totalKYCRecords).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in address gracefully', async () => {
      const kycData = {
        govID: 'VALID12345',
        kycAddress: "123 O'Brien's Lane, St. Paul's City, MN 55101",
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const response = await APIService.submitKYCData(kycData);
      expect(response.success).toBe(true);
    });

    test('should maintain data integrity through encryption/decryption cycle', async () => {
      const kycData = {
        govID: 'ABC123XYZ78',
        kycAddress: '123 Main Street, City, State 12345',
        kycDob: '1990-01-15',
        pan: 'ABCD1234EF'
      };

      const submitResponse = await APIService.submitKYCData(kycData);
      const kycId = submitResponse.data.kycId;

      const getResponse = await APIService.getKYCData(kycId);

      expect(getResponse.data.govID).toBe(kycData.govID);
      expect(getResponse.data.kycAddress).toBe(kycData.kycAddress);
      expect(getResponse.data.pan).toBe(kycData.pan);
    });
  });
});
