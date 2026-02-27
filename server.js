/**
 * Express Server
 * API endpoints for Customer Form and KYC submissions
 * Connects to PostgreSQL database
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for JWT verification

const CustomerModel = require('./db/models/CustomerModel');
const KYCModel = require('./db/models/KYCModel');
const APIService = require('./api/APIService_DB');
const TaxFlowModel = require('./db/models/TaxFlowModel'); // New import for TaxFlowModel
const AnalyticsService = require('./services/AnalyticsService'); // Import Analytics Service

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

// Authentication middleware using JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required: No token provided or malformed' });
  }

  const token = authHeader.split(' ')[1];
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return res.status(500).json({ success: false, message: 'Server configuration error: JWT secret missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info from token
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Placeholder authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.some(role => req.user.roles && req.user.roles.includes(role)))) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

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
// Tax Flow Content Endpoints (New)
// ============================================

/**
 * GET /api/tax-flow-content
 * Retrieve structured content for the Individual Tax Filing Process Flow page.
 * Accessible without authentication for public-facing content.
 */
app.get('/api/tax-flow-content', async (req, res) => {
  let cmsContent = null;
  let fallbackUsed = false;

  try {
    // Story 1: Integrate Analytics for 'Individual Tax Filing Process Flow' Page Engagement
    // Send page view event to analytics service
    AnalyticsService.trackEvent('PageView', {
      page: '/tax-flow-content',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Story 11: Add appropriate caching headers
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Attempt to fetch from CMS first
    try {
      cmsContent = await APIService.getTaxFlowContentFromCMS();
      // Validate CMS content structure
      if (!cmsContent || !cmsContent.steps || !Array.isArray(cmsContent.steps)) {
        throw new Error('CMS returned malformed or empty data.');
      }
    } catch (cmsError) {
      console.warn('CMS integration failed, attempting fallback to database:', cmsError.message);
      fallbackUsed = true;
      // Fallback to database (TaxFlowModel)
      const dbSteps = await TaxFlowModel.getAllSteps(); // Assuming this method exists
      if (dbSteps && dbSteps.length > 0) {
        cmsContent = {
          title: 'Individual Tax Filing Process Flow (Fallback)',
          introText: 'Understand the steps involved in filing your individual taxes with this simple guide. (Content from database fallback)',
          flowchartVisual: {
            imageUrl: process.env.TAX_FLOW_CHART_IMAGE_URL || '/images/tax-flow-chart.svg',
          },
          steps: dbSteps.map(step => ({
            step_id: step.id, // Assuming 'id' from DB
            step_number: step.step_number,
            title: step.title,
            description: step.description,
            order_sequence: step.order_sequence,
            image_url: step.image_url
          }))
        };
      } else {
        // Fallback to static content if both CMS and DB fail
        console.error('Both CMS and database content retrieval failed. Using static fallback.');
        cmsContent = {
          title: 'Individual Tax Filing Process Flow (Static Fallback)',
          introText: 'We are currently experiencing issues retrieving the latest content. Please see a simplified guide below.',
          flowchartVisual: {
            imageUrl: '/images/tax-flow-chart-placeholder.svg',
          },
          steps: [
            { step_id: 'static-1', step_number: 1, title: 'Gather Documents', description: 'Collect all necessary tax documents like W-2s, 1099s, etc.', order_sequence: 1, image_url: '/images/static-step1.svg' },
            { step_id: 'static-2', step_number: 2, title: 'Choose Filing Method', description: 'Decide whether to file online, by mail, or with a professional.', order_sequence: 2, image_url: '/images/static-step2.svg' },
            { step_id: 'static-3', step_number: 3, title: 'Submit Return', description: 'File your tax return by the deadline.', order_sequence: 3, image_url: '/images/static-step3.svg' }
          ]
        };
      }
    }

    // Story 3: Modify to include data relevant to the document viewer
    const documentViewerData = {
      pdfUrl: process.env.FINANCE_POLICY_PDF_URL || '/documents/Finance Policy document.pdf',
      highlightPages: [5, 19], // Specific pages to highlight for flowcharts
      viewerOptions: {
        // e.g., 'zoom': 'auto', 'toolbar': 'visible'
      }
    };

    const responseStatus = fallbackUsed ? 206 : 200; // 206 Partial Content if fallback was used

    res.status(responseStatus).json({
      success: true,
      message: fallbackUsed ? 'Content retrieved with fallback.' : 'Content retrieved successfully.',
      title: cmsContent.title,
      introText: cmsContent.introText,
      flowchartVisual: cmsContent.flowchartVisual,
      steps: cmsContent.steps,
      documentViewer: documentViewerData // Include document viewer data
    });
  } catch (error) {
    console.error('Error retrieving tax flow content:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tax flow content',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/tax-flow-content (Placeholder for future dynamic content updates)
 * Requires authentication and authorization.
 */
app.put('/api/admin/tax-flow-content', authenticate, authorize(['admin', 'content_manager']), async (req, res) => {
  try {
    // This is a placeholder. In a real scenario, you would process req.body
    // to update the tax flow content in the database (e.g., TaxFlowModel.updateStep)
    // or an external CMS.
    console.log('Admin attempting to update tax flow content:', req.body);

    // Simulate an update
    // const { step_id, title, description, order_sequence, image_url } = req.body;
    // const result = await TaxFlowModel.updateStep(step_id, { title, description, order_sequence, image_url });
    // if (!result) {
    //   return res.status(404).json({ success: false, message: 'Tax flow step not found' });
    // }

    res.status(200).json({ success: true, message: 'Content update simulated successfully.' });
  } catch (error) {
    console.error('Error updating tax flow content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tax flow content',
      error: error.message
    });
  }
});

// ============================================
// Server Start
// ============================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});