# Credit Card Onboarding React App

A modern, responsive React application for credit card onboarding with PostgreSQL database integration.

## 🆕 PostgreSQL Database Integration ✅

This application now includes full PostgreSQL support for persistent data storage!

### Database Features
- ✅ **PostgreSQL (Neon DB)** - Cloud-based, secure database
- ✅ **Encrypted Storage** - PAN and Government ID encrypted with AES-256-CBC
- ✅ **Audit Logging** - Complete audit trail of all changes
- ✅ **Connection Pooling** - Optimized performance with connection pool
- ✅ **Data Validation** - Server-side validation for all inputs

### Quick Start (5 Minutes)
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 2. Initialize database
psql -U neondb_owner -d neondb -f db/init.sql

# 3. Install dependencies
npm install

# 4. Start backend (Terminal 1)
node server.js

# 5. Start frontend (Terminal 2)
npm start
```

📚 **See [QUICK_START.md](QUICK_START.md) for detailed setup**

## Features

### Screen 1: Landing Page
- Eye-catching hero section with gradient background
- Feature highlights (instant approval, rewards, no annual fee, 24/7 support)
- Call-to-action button to start the application

### Screen 2: Customer Form
- Comprehensive customer information form with validation
- **Persistent Storage**: Data saved to PostgreSQL database
- Fields include:
  - First Name & Last Name
  - Email & Phone Number
  - Date of Birth
  - Full Address (Address, City, State, Zip Code)
  - Annual Income
- Form validation with error messages
- Success confirmation after submission
- Back button to return to landing page

## Project Structure

```
src/
├── App.js              # Main app component with routing
├── App.css             # Global styles
├── index.js            # React entry point
├── api/                # API integration
│   ├── CustomerDataSubmission.js    # In-memory version
│   └── CustomerDataSubmission_DB.js # Database version (NEW)
└── pages/
    ├── LandingPage.js  # Landing page component
    └── CustomerForm.js # Application form component

db/                     # NEW: Database layer
├── config.js          # Connection pool configuration
├── init.sql           # Database schema
└── models/
    ├── CustomerModel.js # Customer CRUD operations
    └── KYCModel.js      # KYC data operations

api/                    # Backend API services
├── APIService.js      # In-memory version
└── APIService_DB.js   # Database version (NEW)

server.js              # Express backend server (NEW)
```

## Getting Started

### Installation

1. Navigate to the project directory:
```bash
cd "c:\Users\daspa\Desktop\Sample web"
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Edit `.env` and add your PostgreSQL credentials:
```
DATABASE_URL=postgresql://your-credentials@your-host/database
ENCRYPTION_KEY=your-encryption-key
```

4. Initialize database schema:
```bash
psql -U your-username -d your-database -f db/init.sql
```

5. Install dependencies:
```bash
npm install
```

### Running the App

**Terminal 1 - Backend Server:**
```bash
node server.js
```

**Terminal 2 - React Frontend:**
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`  
Backend API available at `http://localhost:9000`

### Building for Production

```bash
npm run build
```

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)** - Comprehensive setup & API reference
- **[DATABASE_INTEGRATION.md](DATABASE_INTEGRATION.md)** - Technical implementation details

## 🔑 Key Technologies

- **Frontend**: React 18, React Router
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon DB)
- **Security**: AES-256-CBC Encryption, CORS, Input Validation
- **Storage**: Persistent encrypted data with audit logs

## 📊 API Endpoints

### Customers
- `POST /api/customers` - Create new customer
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get specific customer
- `PUT /api/customers/:id` - Update customer status

### KYC
- `POST /api/kyc/:customerId` - Submit KYC data
- `GET /api/kyc/:customerId` - Get customer's KYC
- `GET /api/kyc/submission/:id` - Get specific KYC
- `PUT /api/kyc/:id/verify` - Update verification status
- `DELETE /api/kyc/:id` - Delete KYC record

### Monitoring
- `GET /api/health` - Health check
- `GET /api/stats` - Database statistics

## 🔒 Security Features

✅ AES-256-CBC encryption for sensitive data (PAN, Government ID)  
✅ SHA-256 hashing for PAN duplicate detection  
✅ SSL/TLS required for database connections  
✅ CORS protection for API endpoints  
✅ Audit logging of all data changes  
✅ Input validation on server-side  
✅ Secure credential management via environment variables  

## 🧪 Testing

Run test suite:
```bash
npm test
```

This runs tests for:
- Customer form validation
- KYC data validation
- API endpoints
- Database operations
- Encryption/decryption
```

## Technologies Used

- React 18.2.0
- React Router DOM 6.14.0
- CSS3 for styling

## Features

✓ Responsive design (works on mobile, tablet, desktop)
✓ Form validation with user-friendly error messages
✓ Smooth transitions and hover effects
✓ Success confirmation feedback
✓ Clean, modern UI with gradient backgrounds
✓ Easy navigation between pages

## How to Use

1. **Landing Page**: Users see the welcome screen with information about the credit card benefits
2. **Get Started Button**: Clicking this navigates to the application form
3. **Fill Form**: Users enter their personal and financial information
4. **Validation**: Form validates all required fields
5. **Submit**: Upon submission, a success message appears and user is redirected to landing page

## Customization

You can easily customize:
- Colors in `App.css`
- Landing page content in `pages/LandingPage.js`
- Form fields in `pages/CustomerForm.js`
- Validation rules in `CustomerForm.js`
- State options in the state dropdown
- Income ranges in the income dropdown
