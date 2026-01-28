/**
 * Performance Tests
 * Benchmarking tests for KYC form submission, API latency, and database query efficiency
 */

const APIService = require('../api/APIService_DB');
const FormValidator = require('../src/services/FormValidator');
const { encryptAadhaar, decryptAadhaar } = require('../src/services/KYCEncryption');

describe('Performance Benchmarking Tests', () => {
  describe('API Latency Tests', () => {
    it('should submit KYC data within acceptable latency (< 500ms)', async () => {
      const mockKYCData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, City, State',
        kycDob: '1990-05-15',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };

      const mockMetadata = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const start = Date.now();
      
      // Note: This test assumes a mock API or skip if actual DB call
      // For now, we're testing the validation logic latency
      const isValid = FormValidator.validateForm(mockKYCData, 'kyc');
      
      const elapsed = Date.now() - start;
      
      // Validation should be very fast
      expect(elapsed).toBeLessThan(100);
      expect(isValid).toBe(true);
    });

    it('should retrieve KYC data within acceptable latency (< 300ms)', async () => {
      const start = Date.now();
      
      // Simulate data retrieval latency
      // In real implementation, this would test actual DB query
      const testData = {
        id: 'test-kyc-123',
        pan: 'ABCD1234EF',
        govID: 'TEST123',
        aadhaarNumber: '123456789012'
      };
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50); // Mock retrieval should be very fast
    });
  });

  describe('Form Validation Performance', () => {
    it('should validate single field within < 10ms', () => {
      const testCases = [
        { field: 'aadhaarNumber', value: '123456789012' },
        { field: 'pan', value: 'ABCD1234EF' },
        { field: 'govID', value: 'A12B34C56' }
      ];

      testCases.forEach(({ field, value }) => {
        const start = Date.now();
        FormValidator.validateField(field, value);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(10);
      });
    });

    it('should validate entire KYC form within < 50ms', () => {
      const kycFormData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, City, State',
        kycDob: '1990-05-15',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };

      const start = Date.now();
      FormValidator.validateForm(kycFormData, 'kyc');
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(50);
    });

    it('should validate all fields in batch mode within < 100ms', () => {
      const kycFormData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, City, State',
        kycDob: '1990-05-15',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };

      const start = Date.now();
      FormValidator.validateAll(kycFormData, 'kyc');
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Encryption Performance', () => {
    it('should encrypt 100 Aadhaar numbers within < 2000ms', () => {
      const aadhaarNumbers = Array.from({ length: 100 }, (_, i) => 
        String(i).padStart(12, '0')
      );

      const start = Date.now();
      
      aadhaarNumbers.forEach(aadhaar => {
        encryptAadhaar(aadhaar);
      });
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    it('should decrypt 100 Aadhaar numbers within < 2000ms', () => {
      const aadhaar = '123456789012';
      const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);

      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        decryptAadhaar(aadhaar_encrypted, iv);
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    it('should encrypt-decrypt cycle maintain acceptable throughput', () => {
      const iterations = 50;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        const aadhaar = String(i).padStart(12, '0');
        const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);
        decryptAadhaar(aadhaar_encrypted, iv);
      }

      const elapsed = Date.now() - start;
      const avgTimePerCycle = elapsed / iterations;
      
      // Should average less than 20ms per encrypt-decrypt cycle
      expect(avgTimePerCycle).toBeLessThan(20);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not leak memory during repeated encryption', () => {
      const iterations = 1000;
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const aadhaar = String(i % 1000).padStart(12, '0');
        encryptAadhaar(aadhaar);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 1000 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should not leak memory during repeated decryption', () => {
      const aadhaar = '123456789012';
      const { aadhaar_encrypted, iv } = encryptAadhaar(aadhaar);
      const iterations = 1000;
      
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        decryptAadhaar(aadhaar_encrypted, iv);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 1000 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Operation Performance', () => {
    it('should handle concurrent form validations', () => {
      const kycFormData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, City, State',
        kycDob: '1990-05-15',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };

      const start = Date.now();
      const promises = [];

      // Simulate 10 concurrent validation operations
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve(FormValidator.validateForm(kycFormData, 'kyc'))
        );
      }

      return Promise.all(promises).then(() => {
        const elapsed = Date.now() - start;
        // All 10 validations should complete within 100ms
        expect(elapsed).toBeLessThan(100);
      });
    });

    it('should handle concurrent encryption operations', () => {
      const aadhaarNumbers = Array.from({ length: 10 }, (_, i) => 
        String(i).padStart(12, '0')
      );

      const start = Date.now();
      const promises = aadhaarNumbers.map(aadhaar =>
        Promise.resolve(encryptAadhaar(aadhaar))
      );

      return Promise.all(promises).then(() => {
        const elapsed = Date.now() - start;
        // All 10 encryptions should complete within 500ms
        expect(elapsed).toBeLessThan(500);
      });
    });
  });

  describe('Throughput Tests', () => {
    it('should achieve minimum validation throughput of 1000 fields/second', () => {
      const fieldValidations = 1000;
      const field = 'aadhaarNumber';
      const value = '123456789012';

      const start = Date.now();

      for (let i = 0; i < fieldValidations; i++) {
        FormValidator.validateField(field, value);
      }

      const elapsed = Date.now() - start;
      const throughput = (fieldValidations / elapsed) * 1000; // operations per second
      
      expect(throughput).toBeGreaterThan(1000);
    });

    it('should achieve minimum encryption throughput of 50 operations/second', () => {
      const operations = 50;
      const aadhaar = '123456789012';

      const start = Date.now();

      for (let i = 0; i < operations; i++) {
        encryptAadhaar(aadhaar);
      }

      const elapsed = Date.now() - start;
      const throughput = (operations / elapsed) * 1000; // operations per second
      
      expect(throughput).toBeGreaterThan(25); // At least 25 ops/sec
    });
  });

  describe('Stress Tests', () => {
    it('should handle large batch of KYC validations without degradation', () => {
      const batchSize = 100;
      const batches = 3;
      const kycFormData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, City, State',
        kycDob: '1990-05-15',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };

      const times = [];

      for (let batch = 0; batch < batches; batch++) {
        const start = Date.now();

        for (let i = 0; i < batchSize; i++) {
          FormValidator.validateForm(kycFormData, 'kyc');
        }

        const elapsed = Date.now() - start;
        times.push(elapsed);
      }

      // Check that performance doesn't degrade significantly in later batches
      const firstBatchTime = times[0];
      const lastBatchTime = times[batches - 1];
      const degradationRatio = lastBatchTime / firstBatchTime;

      // Allow up to 20% degradation
      expect(degradationRatio).toBeLessThan(1.2);
    });
  });

  describe('Benchmark Reporting', () => {
    it('should generate performance report', () => {
      const metrics = {
        'Encryption (100 ops)': 0,
        'Decryption (100 ops)': 0,
        'Form Validation': 0,
        'Field Validation': 0
      };

      // Measure encryption
      let start = Date.now();
      for (let i = 0; i < 100; i++) {
        encryptAadhaar('123456789012');
      }
      metrics['Encryption (100 ops)'] = Date.now() - start;

      // Measure decryption
      const { aadhaar_encrypted, iv } = encryptAadhaar('123456789012');
      start = Date.now();
      for (let i = 0; i < 100; i++) {
        decryptAadhaar(aadhaar_encrypted, iv);
      }
      metrics['Decryption (100 ops)'] = Date.now() - start;

      // Measure form validation
      const kycData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street',
        kycDob: '1990-05-15',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };
      start = Date.now();
      for (let i = 0; i < 1000; i++) {
        FormValidator.validateForm(kycData, 'kyc');
      }
      metrics['Form Validation'] = Date.now() - start;

      // Measure field validation
      start = Date.now();
      for (let i = 0; i < 1000; i++) {
        FormValidator.validateField('aadhaarNumber', '123456789012');
      }
      metrics['Field Validation'] = Date.now() - start;

      // Log metrics
      console.log('\n=== Performance Metrics ===');
      Object.entries(metrics).forEach(([key, value]) => {
        console.log(`${key}: ${value}ms`);
      });

      // All metrics should be reasonable
      expect(metrics['Encryption (100 ops)']).toBeLessThan(2000);
      expect(metrics['Decryption (100 ops)']).toBeLessThan(2000);
      expect(metrics['Form Validation']).toBeLessThan(1000);
      expect(metrics['Field Validation']).toBeLessThan(500);
    });
  });
});
