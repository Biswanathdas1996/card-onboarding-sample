-- KYC Application Database Schema
-- PostgreSQL initialization script for Neon DB

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS customer_forms CASCADE;

-- ============================================
-- Customer Forms Table
-- Stores customer form submissions
-- ============================================
CREATE TABLE customer_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  account_type VARCHAR(50) NOT NULL,
  employment_status VARCHAR(50),
  annual_income VARCHAR(50),
  date_of_birth DATE,
  nationality VARCHAR(100),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' -- pending, approved, rejected
);

-- Create index on email for faster lookups
CREATE INDEX idx_customer_email ON customer_forms(email);
CREATE INDEX idx_customer_status ON customer_forms(status);
CREATE INDEX idx_customer_created_at ON customer_forms(created_at);

-- ============================================
-- KYC Submissions Table
-- Stores KYC (Know Your Customer) data
-- ============================================
CREATE TABLE kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_forms(id) ON DELETE CASCADE,
  
  -- Personal Information
  pan VARCHAR(255) NOT NULL UNIQUE, -- Encrypted
  gov_id VARCHAR(500) NOT NULL,   -- Encrypted (Passport, Aadhaar, etc.)
  gov_id_type VARCHAR(50),        -- Type of government ID
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100),
  
  -- Address Information
  kyc_address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Additional Info
  occupation VARCHAR(100),
  politically_exposed_person BOOLEAN DEFAULT FALSE,
  risk_assessment VARCHAR(50), -- low, medium, high
  
  -- Document Verification
  document_url VARCHAR(500),
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verification_notes TEXT,
  verified_by VARCHAR(100),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  ip_address INET,
  user_agent VARCHAR(500),
  submission_source VARCHAR(50)
);

-- Create indexes for KYC data
CREATE INDEX idx_kyc_customer_id ON kyc_submissions(customer_id);
CREATE INDEX idx_kyc_pan ON kyc_submissions(pan);
CREATE INDEX idx_kyc_status ON kyc_submissions(verification_status);
CREATE INDEX idx_kyc_created_at ON kyc_submissions(created_at);
CREATE INDEX idx_kyc_risk ON kyc_submissions(risk_assessment);

-- ============================================
-- PAN Hash Table (For duplicate detection)
-- Stores hashed PAN values for quick duplicate checks
-- ============================================
CREATE TABLE pan_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pan_hash VARCHAR(255) NOT NULL UNIQUE,
  kyc_id UUID NOT NULL REFERENCES kyc_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pan_hash ON pan_hashes(pan_hash);

-- ============================================
-- Audit Log Table
-- Tracks all modifications to customer and KYC data
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  user_id VARCHAR(255),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_customer_forms_updated_at
  BEFORE UPDATE ON customer_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_submissions_updated_at
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Grant appropriate permissions
-- ============================================
-- Note: Adjust username as needed for your setup
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_forms TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON kyc_submissions TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON pan_hashes TO neondb_owner;
GRANT SELECT, INSERT ON audit_logs TO neondb_owner;

-- Allow seq access for UUID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

COMMIT;
