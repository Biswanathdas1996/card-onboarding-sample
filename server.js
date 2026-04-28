/**
 * Express Server
 * API endpoints for Customer Form and KYC submissions
 * Connects to PostgreSQL database
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const CustomerModel = require('./db/models/CustomerModel');
const KYCModel = require('./db/models/KYCModel');
const BasicDetailsModel = require('./db/models/BasicDetailsModel');
const APIService = require('./api/APIService_DB');

const app = express();
const PORT = process.env.API_PORT || 5000;

// ============================================
// Middleware
// ============================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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

    console.log('KYC Submission received:', JSON.stringify(req.body, null, 2));

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

/**
 * GET /api/kyc/submission/:kycId
 * Retrieve specific KYC submission by ID
 */
app.get('/api/kyc/submission/:kycId', async (req, res) => {
  try {
    const result = await APIService.getKYCData(req.params.kycId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error retrieving KYC submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving KYC submission',
      error: error.message
    });
  }
});

/**
 * PUT /api/kyc/:kycId/verify
 * Update KYC verification status
 */
app.put('/api/kyc/:kycId/verify', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const result = await APIService.updateVerificationStatus(
      req.params.kycId,
      status,
      notes || ''
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: error.message
    });
  }
});

/**
 * DELETE /api/kyc/:kycId
 * Delete KYC record
 */
app.delete('/api/kyc/:kycId', async (req, res) => {
  try {
    const result = await APIService.deleteKYCData(req.params.kycId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting KYC:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting KYC data',
      error: error.message
    });
  }
});

// ============================================
// Basic Details Endpoints
// ============================================

/**
 * POST /api/basic-details
 * Submit new basic details
 */
app.post('/api/basic-details', async (req, res) => {
  try {
    const result = await BasicDetailsModel.create(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create basic details',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Basic details submitted successfully'
    });
  } catch (error) {
    console.error('Error creating basic details:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating basic details',
      error: error.message
    });
  }
});

/**
 * GET /api/basic-details
 * Get all basic details (paginated)
 */
app.get('/api/basic-details', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const basicDetails = await BasicDetailsModel.getAll(limit, offset);
    const total = await BasicDetailsModel.count();

    res.json({
      success: true,
      data: basicDetails,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error retrieving basic details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving basic details',
      error: error.message
    });
  }
});

/**
 * GET /api/basic-details/:id
 * Retrieve basic details by ID
 */
app.get('/api/basic-details/:id', async (req, res) => {
  try {
    const basicDetail = await BasicDetailsModel.getById(req.params.id);

    if (!basicDetail) {
      return res.status(404).json({
        success: false,
        message: 'Basic details not found'
      });
    }

    res.json({
      success: true,
      data: basicDetail
    });
  } catch (error) {
    console.error('Error retrieving basic details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving basic details',
      error: error.message
    });
  }
});

/**
 * DELETE /api/basic-details/:id
 * Delete basic details record
 */
app.delete('/api/basic-details/:id', async (req, res) => {
  try {
    const result = await BasicDetailsModel.delete(req.params.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Basic details not found'
      });
    }

    res.json({
      success: true,
      message: 'Basic details deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting basic details:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting basic details',
      error: error.message
    });
  }
});

// ============================================
// Admin/Monitoring Endpoints
// ============================================

/**
 * GET /api/stats
 * Get database statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await APIService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving stats',
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'KYC API Server'
  });
});

// ============================================
// Error Handling
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// Server Startup
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    KYC API Server Started Successfully  ║
╚════════════════════════════════════════╝

🌐 Server:    http://localhost:${PORT}
📊 Health:    http://localhost:${PORT}/api/health
📈 Stats:     http://localhost:${PORT}/api/stats

Database:     ${process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured'}
Environment:  ${process.env.NODE_ENV || 'development'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API Endpoints:
  POST   /api/customers           - Submit customer form
  GET    /api/customers           - Get all customers
  GET    /api/customers/:id       - Get customer by ID
  PUT    /api/customers/:id       - Update customer status

  POST   /api/kyc/:customerId    - Submit KYC data
  GET    /api/kyc/:customerId    - Get customer's KYC
  GET    /api/kyc/submission/:id - Get KYC by ID
  PUT    /api/kyc/:id/verify     - Update verification status
  DELETE /api/kyc/:id            - Delete KYC record

  POST   /api/basic-details      - Submit basic details
  GET    /api/basic-details      - Get all basic details
  GET    /api/basic-details/:id  - Get basic details by ID
  DELETE /api/basic-details/:id  - Delete basic details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
