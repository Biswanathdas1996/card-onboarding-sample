/**
 * Debug Server - Shows detailed logs for troubleshooting
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const CustomerModel = require('./db/models/CustomerModel');
const KYCModel = require('./db/models/KYCModel');

const app = express();
const PORT = process.env.API_PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('\n🧪 Testing database connection...');
    const db = require('./db/config');
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('⏰ Current time from DB:', result.rows[0].current_time);
    res.json({ success: true, message: 'Database connected', time: result.rows[0].current_time });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Customer with detailed logging
app.post('/api/customers', async (req, res) => {
  try {
    console.log('🔍 Creating customer...');
    console.log('   Data:', JSON.stringify(req.body, null, 2));

    const result = await CustomerModel.create(req.body);

    console.log('✅ Customer created successfully!');
    console.log('   Customer ID:', result.customerId);
    console.log('   Created at:', result.createdAt);

    res.status(201).json({
      success: true,
      customerId: result.customerId,
      message: 'Customer record created successfully',
      createdAt: result.createdAt
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating customer record',
      error: error.message
    });
  }
});

// Get Customers
app.get('/api/customers', async (req, res) => {
  try {
    console.log('🔍 Fetching all customers...');
    const customers = await CustomerModel.getAll(20, 0);
    const total = await CustomerModel.count();
    
    console.log(`✅ Found ${total} customers`);
    res.json({
      success: true,
      data: customers,
      total: total
    });
  } catch (error) {
    console.error('❌ Error fetching customers:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create KYC with detailed logging
app.post('/api/kyc/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    console.log('🔍 Creating KYC for customer:', customerId);
    console.log('   Data:', JSON.stringify(req.body, null, 2));

    // Check if customer exists
    const customer = await CustomerModel.getById(customerId);
    if (!customer) {
      console.error('❌ Customer not found:', customerId);
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    console.log('✅ Customer found:', customer.first_name, customer.last_name);

    // Create KYC
    const result = await KYCModel.create(customerId, req.body);
    
    if (!result.success) {
      console.error('❌ KYC creation failed:', result.error);
      return res.status(409).json(result);
    }

    console.log('✅ KYC created successfully!');
    console.log('   KYC ID:', result.kycId);
    console.log('   Created at:', result.createdAt);

    res.status(201).json({
      success: true,
      status: 201,
      message: 'KYC data submitted successfully',
      data: {
        kycId: result.kycId,
        customerId: customerId,
        verificationStatus: 'pending',
        createdAt: result.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error submitting KYC:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error submitting KYC data',
      error: error.message
    });
  }
});

// Get Customers
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    console.log('🔍 Fetching customer:', req.params.customerId);
    const customer = await CustomerModel.getById(req.params.customerId);
    
    if (!customer) {
      console.log('❌ Customer not found');
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    console.log('✅ Customer found');
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('❌ Error fetching customer:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get KYC
app.get('/api/kyc/:customerId', async (req, res) => {
  try {
    console.log('🔍 Fetching KYC for customer:', req.params.customerId);
    const kyc = await KYCModel.getByCustomerId(req.params.customerId);
    
    if (!kyc) {
      console.log('❌ No KYC found for customer');
      return res.status(404).json({ success: false, message: 'No KYC found' });
    }
    
    console.log('✅ KYC found');
    res.json({ success: true, data: kyc });
  } catch (error) {
    console.error('❌ Error fetching KYC:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('💚 Health check');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🐛 KYC DEBUG SERVER                      ║
║   (Detailed logging enabled)               ║
║                                            ║
╚════════════════════════════════════════════╝

🌐 Server:        http://localhost:${PORT}
🧪 Test DB:       http://localhost:${PORT}/api/test-connection
📊 Health:        http://localhost:${PORT}/api/health
📝 Debug logs:    Check this terminal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database configured: ${process.env.DATABASE_URL ? '✓' : '✗'}
Environment: ${process.env.NODE_ENV}
CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instructions:
1. Test connection: curl http://localhost:${PORT}/api/test-connection
2. Submit customer: curl -X POST http://localhost:${PORT}/api/customers -H "Content-Type: application/json" -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'
3. Check browser console for form submission logs

All requests will be logged below:

  `);
});
