const request = require('supertest');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Mock external modules
jest.mock('./db/models/CustomerModel');
jest.mock('./db/models/KYCModel');
jest.mock('./db/models/BasicDetailsModel');
jest.mock('./api/APIService_DB');

const CustomerModel = require('./db/models/CustomerModel');
const KYCModel = require('./db/models/KYCModel'); // Although not directly used in server.js, it's mocked for completeness if it were.
const BasicDetailsModel = require('./db/models/BasicDetailsModel');
const APIService = require('./api/APIService_DB');

// Dynamically import the app after mocks are set up
let app;

describe('Express Server Endpoints', () => {
  beforeAll(() => {
    // Set up a test app instance to avoid issues with module caching and port conflicts
    const serverModule = require('./server'); // Import the actual server file
    app = serverModule.app; // Assuming the app instance is exported
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock console.log to prevent test output from cluttering
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console.log
    jest.restoreAllMocks();
  });

  // Middleware tests (basic check for functionality)
  describe('Middleware', () => {
    test('should apply CORS headers', async () => {
      const testApp = express();
      testApp.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
      }));
      testApp.get('/test', (req, res) => res.send('ok'));
      const res = await request(testApp).get('/test');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('should parse JSON body', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test', (req, res) => res.json(req.body));
      const res = await request(testApp)
        .post('/test')
        .send({
          key: 'value'
        })
        .expect(200);
      expect(res.body).toEqual({
        key: 'value'
      });
    });

    test('should log requests', async () => {
      const logSpy = jest.spyOn(console, 'log');
      await request(app).get('/api/customers');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/customers'));
    });
  });

  // ============================================
  // Customer Form Endpoints
  // ============================================

  describe('POST /api/customers', () => {
    test('TC-CUST-001: should create a new customer record successfully', async () => {
      CustomerModel.create.mockResolvedValue({
        success: true,
        customerId: 'cust-123',
        createdAt: '2023-01-01T00:00:00Z'
      });

      const newCustomerData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const res = await request(app)
        .post('/api/customers')
        .send(newCustomerData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({
        success: true,
        customerId: 'cust-123',
        message: 'Customer record created successfully',
        createdAt: '2023-01-01T00:00:00Z'
      });
      expect(CustomerModel.create).toHaveBeenCalledWith(newCustomerData);
    });

    test('TC-CUST-002: should return 409 if customer creation fails due to conflict', async () => {
      CustomerModel.create.mockResolvedValue({
        success: false,
        error: 'Customer with this email already exists',
        code: 'DUPLICATE_ENTRY'
      });

      const newCustomerData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const res = await request(app)
        .post('/api/customers')
        .send(newCustomerData);

      expect(res.statusCode).toEqual(409);
      expect(res.body).toEqual({
        success: false,
        message: 'Customer with this email already exists',
        code: 'DUPLICATE_ENTRY',
        error: 'Customer with this email already exists'
      });
      expect(CustomerModel.create).toHaveBeenCalledWith(newCustomerData);
    });

    test('TC-CUST-003: should return 500 if an unexpected error occurs during customer creation', async () => {
      CustomerModel.create.mockRejectedValue(new Error('Database connection lost'));

      const newCustomerData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const res = await request(app)
        .post('/api/customers')
        .send(newCustomerData);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error creating customer record',
        error: 'Database connection lost'
      });
      expect(CustomerModel.create).toHaveBeenCalledWith(newCustomerData);
    });
  });

  describe('GET /api/customers/:customerId', () => {
    test('TC-CUST-004: should retrieve a customer by ID successfully', async () => {
      const customerData = {
        id: 'cust-123',
        name: 'John Doe',
        email: 'john@example.com'
      };
      CustomerModel.getById.mockResolvedValue(customerData);

      const res = await request(app).get('/api/customers/cust-123');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        data: customerData
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith('cust-123');
    });

    test('TC-CUST-005: should return 404 if customer is not found', async () => {
      CustomerModel.getById.mockResolvedValue(null);

      const res = await request(app).get('/api/customers/non-existent-id');

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Customer not found'
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith('non-existent-id');
    });

    test('TC-CUST-006: should return 500 if an unexpected error occurs during customer retrieval', async () => {
      CustomerModel.getById.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/api/customers/cust-123');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error retrieving customer',
        error: 'Network error'
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith('cust-123');
    });
  });

  describe('GET /api/customers', () => {
    test('TC-CUST-007: should retrieve all customers with default pagination', async () => {
      const customersData = [{
        id: 'cust-1',
        name: 'A'
      }, {
        id: 'cust-2',
        name: 'B'
      }];
      CustomerModel.getAll.mockResolvedValue(customersData);
      CustomerModel.count.mockResolvedValue(100);

      const res = await request(app).get('/api/customers');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        data: customersData,
        pagination: {
          limit: 20,
          offset: 0,
          total: 100,
          hasMore: true
        }
      });
      expect(CustomerModel.getAll).toHaveBeenCalledWith(20, 0);
      expect(CustomerModel.count).toHaveBeenCalledTimes(1);
    });

    test('TC-CUST-008: should retrieve customers with custom pagination parameters', async () => {
      const customersData = [{
        id: 'cust-21',
        name: 'U'
      }, {
        id: 'cust-22',
        name: 'V'
      }];
      CustomerModel.getAll.mockResolvedValue(customersData);
      CustomerModel.count.mockResolvedValue(100);

      const res = await request(app).get('/api/customers?limit=2&offset=20');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        data: customersData,
        pagination: {
          limit: 2,
          offset: 20,
          total: 100,
          hasMore: true
        }
      });
      expect(CustomerModel.getAll).toHaveBeenCalledWith(2, 20);
      expect(CustomerModel.count).toHaveBeenCalledTimes(1);
    });

    test('TC-CUST-009: should handle pagination when no more customers are available', async () => {
      const customersData = [{
        id: 'cust-99',
        name: 'YY'
      }, {
        id: 'cust-100',
        name: 'ZZ'
      }];
      CustomerModel.getAll.mockResolvedValue(customersData);
      CustomerModel.count.mockResolvedValue(100);

      const res = await request(app).get('/api/customers?limit=2&offset=98');

      expect(res.statusCode).toEqual(200);
      expect(res.body.pagination.hasMore).toBe(false);
      expect(CustomerModel.getAll).toHaveBeenCalledWith(2, 98);
    });

    test('TC-CUST-010: should return 500 if an unexpected error occurs during all customers retrieval', async () => {
      CustomerModel.getAll.mockRejectedValue(new Error('DB query failed'));

      const res = await request(app).get('/api/customers');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error retrieving customers',
        error: 'DB query failed'
      });
      expect(CustomerModel.getAll).toHaveBeenCalledWith(20, 0);
      expect(CustomerModel.count).not.toHaveBeenCalled(); // Should not be called if getAll fails
    });
  });

  describe('PUT /api/customers/:customerId', () => {
    test('TC-CUST-011: should update customer status successfully', async () => {
      const updatedCustomer = {
        id: 'cust-123',
        status: 'approved'
      };
      CustomerModel.updateStatus.mockResolvedValue(updatedCustomer);

      const res = await request(app)
        .put('/api/customers/cust-123')
        .send({
          status: 'approved'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Customer status updated',
        data: updatedCustomer
      });
      expect(CustomerModel.updateStatus).toHaveBeenCalledWith('cust-123', 'approved');
    });

    test('TC-CUST-012: should return 400 for an invalid status', async () => {
      const res = await request(app)
        .put('/api/customers/cust-123')
        .send({
          status: 'invalid_status'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid status. Must be: pending, approved, or rejected'
      });
      expect(CustomerModel.updateStatus).not.toHaveBeenCalled();
    });

    test('TC-CUST-013: should return 404 if customer to update is not found', async () => {
      CustomerModel.updateStatus.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/customers/non-existent-id')
        .send({
          status: 'rejected'
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Customer not found'
      });
      expect(CustomerModel.updateStatus).toHaveBeenCalledWith('non-existent-id', 'rejected');
    });

    test('TC-CUST-014: should return 500 if an unexpected error occurs during customer status update', async () => {
      CustomerModel.updateStatus.mockRejectedValue(new Error('DB update error'));

      const res = await request(app)
        .put('/api/customers/cust-123')
        .send({
          status: 'pending'
        });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error updating customer',
        error: 'DB update error'
      });
      expect(CustomerModel.updateStatus).toHaveBeenCalledWith('cust-123', 'pending');
    });
  });

  // ============================================
  // KYC Endpoints
  // ============================================

  describe('POST /api/kyc/:customerId', () => {
    const kycData = {
      documentType: 'passport',
      documentNumber: '12345'
    };
    const customerId = 'cust-456';

    test('TC-KYC-001: should submit KYC data successfully for an existing customer', async () => {
      CustomerModel.getById.mockResolvedValue({
        id: customerId,
        name: 'Jane Doe'
      });
      APIService.submitKYCData.mockResolvedValue({
        success: true,
        status: 201,
        kycId: 'kyc-789',
        message: 'KYC data submitted successfully'
      });

      const res = await request(app)
        .post(`/api/kyc/${customerId}`)
        .send(kycData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({
        success: true,
        status: 201,
        kycId: 'kyc-789',
        message: 'KYC data submitted successfully'
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith(customerId);
      expect(APIService.submitKYCData).toHaveBeenCalledWith(
        kycData,
        customerId,
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });

    test('TC-KYC-002: should return 404 if customer does not exist for KYC submission', async () => {
      CustomerModel.getById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/kyc/${customerId}`)
        .send(kycData);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Customer not found'
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith(customerId);
      expect(APIService.submitKYCData).not.toHaveBeenCalled();
    });

    test('TC-KYC-003: should return error status from APIService if KYC submission fails', async () => {
      CustomerModel.getById.mockResolvedValue({
        id: customerId,
        name: 'Jane Doe'
      });
      APIService.submitKYCData.mockResolvedValue({
        success: false,
        status: 400,
        message: 'Invalid document format'
      });

      const res = await request(app)
        .post(`/api/kyc/${customerId}`)
        .send(kycData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        success: false,
        status: 400,
        message: 'Invalid document format'
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith(customerId);
      expect(APIService.submitKYCData).toHaveBeenCalledTimes(1);
    });

    test('TC-KYC-004: should return 500 if an unexpected error occurs during KYC submission', async () => {
      CustomerModel.getById.mockResolvedValue({
        id: customerId,
        name: 'Jane Doe'
      });
      APIService.submitKYCData.mockRejectedValue(new Error('External API down'));

      const res = await request(app)
        .post(`/api/kyc/${customerId}`)
        .send(kycData);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        status: 500,
        message: 'Error submitting KYC data',
        error: 'External API down'
      });
      expect(CustomerModel.getById).toHaveBeenCalledWith(customerId);
      expect(APIService.submitKYCData).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/kyc/:customerId', () => {
    const customerId = 'cust-456';

    test('TC-KYC-005: should retrieve KYC data for a customer successfully', async () => {
      const kycResult = {
        success: true,
        status: 200,
        data: [{
          kycId: 'kyc-1',
          status: 'pending'
        }]
      };
      APIService.getKYCDataByCustomer.mockResolvedValue(kycResult);

      const res = await request(app).get(`/api/kyc/${customerId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(kycResult);
      expect(APIService.getKYCDataByCustomer).toHaveBeenCalledWith(customerId);
    });

    test('TC-KYC-006: should return error status from APIService if KYC data retrieval fails', async () => {
      const kycResult = {
        success: false,
        status: 404,
        message: 'KYC data not found for customer'
      };
      APIService.getKYCDataByCustomer.mockResolvedValue(kycResult);

      const res = await request(app).get(`/api/kyc/${customerId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual(kycResult);
      expect(APIService.getKYCDataByCustomer).toHaveBeenCalledWith(customerId);
    });

    test('TC-KYC-007: should return 500 if an unexpected error occurs during KYC data retrieval', async () => {
      APIService.getKYCDataByCustomer.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get(`/api/kyc/${customerId}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error retrieving KYC data',
        error: 'DB error'
      });
      expect(APIService.getKYCDataByCustomer).toHaveBeenCalledWith(customerId);
    });
  });

  describe('GET /api/kyc/submission/:kycId', () => {
    const kycId = 'kyc-789';

    test('TC-KYC-008: should retrieve a specific KYC submission by ID successfully', async () => {
      const kycResult = {
        success: true,
        status: 200,
        data: {
          kycId: kycId,
          documentType: 'passport',
          status: 'pending'
        }
      };
      APIService.getKYCData.mockResolvedValue(kycResult);

      const res = await request(app).get(`/api/kyc/submission/${kycId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(kycResult);
      expect(APIService.getKYCData).toHaveBeenCalledWith(kycId);
    });

    test('TC-KYC-009: should return error status from APIService if specific KYC submission not found', async () => {
      const kycResult = {
        success: false,
        status: 404,
        message: 'KYC submission not found'
      };
      APIService.getKYCData.mockResolvedValue(kycResult);

      const res = await request(app).get(`/api/kyc/submission/${kycId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual(kycResult);
      expect(APIService.getKYCData).toHaveBeenCalledWith(kycId);
    });

    test('TC-KYC-010: should return 500 if an unexpected error occurs during specific KYC submission retrieval', async () => {
      APIService.getKYCData.mockRejectedValue(new Error('Service unavailable'));

      const res = await request(app).get(`/api/kyc/submission/${kycId}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error retrieving KYC submission',
        error: 'Service unavailable'
      });
      expect(APIService.getKYCData).toHaveBeenCalledWith(kycId);
    });
  });

  describe('PUT /api/kyc/:kycId/verify', () => {
    const kycId = 'kyc-789';

    test('TC-KYC-011: should update KYC verification status successfully', async () => {
      const updateResult = {
        success: true,
        status: 200,
        message: 'KYC status updated',
        data: {
          kycId: kycId,
          verificationStatus: 'approved'
        }
      };
      APIService.updateVerificationStatus.mockResolvedValue(updateResult);

      const res = await request(app)
        .put(`/api/kyc/${kycId}/verify`)
        .send({
          status: 'approved',
          notes: 'Documents verified'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(updateResult);
      expect(APIService.updateVerificationStatus).toHaveBeenCalledWith(
        kycId,
        'approved',
        'Documents verified'
      );
    });

    test('TC-KYC-012: should update KYC verification status successfully without notes', async () => {
      const updateResult = {
        success: true,
        status: 200,
        message: 'KYC status updated',
        data: {
          kycId: kycId,
          verificationStatus: 'rejected'
        }
      };
      APIService.updateVerificationStatus.mockResolvedValue(updateResult);

      const res = await request(app)
        .put(`/api/kyc/${kycId}/verify`)
        .send({
          status: 'rejected'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(updateResult);
      expect(APIService.updateVerificationStatus).toHaveBeenCalledWith(
        kycId,
        'rejected',
        ''
      );
    });

    test('TC-KYC-013: should return error status from APIService if KYC verification update fails', async () => {
      const updateResult = {
        success: false,
        status: 400,
        message: 'Invalid verification status'
      };
      APIService.updateVerificationStatus.mockResolvedValue(updateResult);

      const res = await request(app)
        .put(`/api/kyc/${kycId}/verify`)
        .send({
          status: 'invalid',
          notes: 'Bad request'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(updateResult);
      expect(APIService.updateVerificationStatus).toHaveBeenCalledWith(
        kycId,
        'invalid',
        'Bad request'
      );
    });

    test('TC-KYC-014: should return 500 if an unexpected error occurs during KYC verification update', async () => {
      APIService.updateVerificationStatus.mockRejectedValue(new Error('Internal server error'));

      const res = await request(app)
        .put(`/api/kyc/${kycId}/verify`)
        .send({
          status: 'approved'
        });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error updating verification status',
        error: 'Internal server error'
      });
      expect(APIService.updateVerificationStatus).toHaveBeenCalledWith(
        kycId,
        'approved',
        ''
      );
    });
  });

  describe('DELETE /api/kyc/:kycId', () => {
    const kycId = 'kyc-789';

    test('TC-KYC-015: should delete KYC record successfully', async () => {
      const deleteResult = {
        success: true,
        status: 200,
        message: 'KYC record deleted'
      };
      APIService.deleteKYCData.mockResolvedValue(deleteResult);

      const res = await request(app).delete(`/api/kyc/${kycId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(deleteResult);
      expect(APIService.deleteKYCData).toHaveBeenCalledWith(kycId);
    });

    test('TC-KYC-016: should return error status from APIService if KYC record not found for deletion', async () => {
      const deleteResult = {
        success: false,
        status: 404,
        message: 'KYC record not found'
      };
      APIService.deleteKYCData.mockResolvedValue(deleteResult);

      const res = await request(app).delete(`/api/kyc/${kycId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual(deleteResult);
      expect(APIService.deleteKYCData).toHaveBeenCalledWith(kycId);
    });

    test('TC-KYC-017: should return 500 if an unexpected error occurs during KYC record deletion', async () => {
      APIService.deleteKYCData.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete(`/api/kyc/${kycId}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error deleting KYC data',
        error: 'Database error'
      });
      expect(APIService.deleteKYCData).toHaveBeenCalledWith(kycId);
    });
  });

  // ============================================
  // Basic Details Endpoints
  // ============================================

  describe('POST /api/basic-details', () => {
    const basicDetailsData = {
      name: 'Alice',
      dateOfBirth: '1990-05-15',
      address: '123 Main St'
    };

    test('TC-BD-001: should create new basic details successfully', async () => {
      const createdRecord = {
        id: 'bd-123',
        ...basicDetailsData,
        created_at: '2023-01-01T00:00:00Z'
      };
      BasicDetailsModel.create.mockResolvedValue({
        success: true,
        data: createdRecord
      });

      const res = await request(app)
        .post('/api/basic-details')
        .send(basicDetailsData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({
        success: true,
        message: 'Basic details created successfully',
        data: createdRecord
      });
      expect(BasicDetailsModel.create).toHaveBeenCalledWith(basicDetailsData);
    });

    test('TC-BD-002: should return 400 if basic details creation fails', async () => {
      BasicDetailsModel.create.mockResolvedValue({
        success: false,
        error: 'Validation failed'
      });

      const res = await request(app)
        .post('/api/basic-details')
        .send({}); // Invalid data

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Failed to create basic details',
        error: 'Validation failed'
      });
      expect(BasicDetailsModel.create).toHaveBeenCalledWith({});
    });

    test('TC-BD-003: should return 500 if an unexpected error occurs during basic details creation', async () => {
      BasicDetailsModel.create.mockRejectedValue(new Error('DB connection error'));

      const res = await request(app)
        .post('/api/basic-details')
        .send(basicDetailsData);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error creating basic details record',
        error: 'DB connection error'
      });
      expect(BasicDetailsModel.create).toHaveBeenCalledWith(basicDetailsData);
    });
  });
});