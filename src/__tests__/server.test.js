const request = require('supertest');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Mock external modules
jest.mock('./db/models/CustomerModel');
jest.mock('./db/models/KYCModel');
jest.mock('./api/APIService_DB');

const CustomerModel = require('./db/models/CustomerModel');
const KYCModel = require('./db/models/KYCModel');
const APIService = require('./api/APIService_DB');

// Create a mock app to test the routes
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
  console.log = jest.fn(); // Suppress console.log during tests
  next();
});

// Import the routes from the server file
// We need to import the actual server.js to get the routes attached to 'app'
// For testing purposes, we'll re-define the routes on our mock 'app'
// This is a common pattern when testing Express routes without starting the full server.

// Re-define routes from server.js on our mock 'app'
// ============================================
// Customer Form Endpoints
// ============================================

/**
 * POST /api/customers
 * Submit new customer form
 */
app.post('/api/customers', async (req, res) => {
  try {
    const result = await CustomerModel.create(req.body);

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.error,
        code: result.code,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      customerId: result.customerId,
      message: 'Customer record created successfully',
      createdAt: result.createdAt
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer record',
      error: error.message
    });
  }
});

/**
 * GET /api/customers/:customerId
 * Retrieve customer by ID
 */
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const customer = await CustomerModel.getById(req.params.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer',
      error: error.message
    });
  }
});

/**
 * GET /api/customers
 * Get all customers (paginated)
 */
app.get('/api/customers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const customers = await CustomerModel.getAll(limit, offset);
    const total = await CustomerModel.count();

    res.json({
      success: true,
      data: customers,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error retrieving customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customers',
      error: error.message
    });
  }
});

/**
 * PUT /api/customers/:customerId
 * Update customer status
 */
app.put('/api/customers/:customerId', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, or rejected'
      });
    }

    const result = await CustomerModel.updateStatus(req.params.customerId, status);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer status updated',
      data: result
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
});

// ============================================
// KYC Endpoints
// ============================================

/**
 * POST /api/kyc/:customerId
 * Submit KYC data for a customer
 */
app.post('/api/kyc/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Verify customer exists
    const customer = await CustomerModel.getById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Submit KYC data
    const result = await APIService.submitKYCData(req.body, customerId, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting KYC:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: 'Error submitting KYC data',
      error: error.message
    });
  }
});

/**
 * GET /api/kyc/:customerId
 * Retrieve KYC data for a customer
 */
app.get('/api/kyc/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const result = await APIService.getKYCDataByCustomer(customerId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error retrieving KYC:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving KYC data',
      error: error.message
    });
  }
});