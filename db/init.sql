-- KYC Application Database Schema
-- PostgreSQL initialization script for Neon DB

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS mfa_challenges CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS pan_hashes CASCADE;
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS customer_forms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Users Table
-- Stores authenticated user accounts for the application
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(500) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'consultant', -- consultant, admin, etc.
  is_active BOOLEAN DEFAULT TRUE,

  -- Account lockout tracking (US-3, US-8, US-13)
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,

  -- MFA configuration
  mfa_secret VARCHAR(255),           -- TOTP secret or similar, encrypted
  mfa_enabled BOOLEAN DEFAULT FALSE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_locked_until ON users(locked_until);

-- ============================================
-- Password Resets Table
-- Stores password reset tokens for the forgot-password flow (US-1, US-6, US-11)
-- ============================================
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(500) NOT NULL UNIQUE, -- Hashed reset token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,        -- NULL until token is consumed
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

-- ============================================
-- MFA Challenges Table
-- Stores in-flight MFA challenges for the second-factor step (US-4, US-9, US-14)
-- ============================================
CREATE TABLE mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_token VARCHAR(500) NOT NULL UNIQUE, -- Opaque session token linking primary auth to MFA step
  otp_hash VARCHAR(500),                        -- Hashed OTP/code if applicable
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,                   -- MFA attempt counter for rate-limiting (US-14)
  max_attempts INTEGER DEFAULT 5,               -- Maximum allowed MFA attempts per challenge
  verified_at TIMESTAMP WITH TIME ZONE,         -- NULL until MFA succeeds
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mfa_challenges_user_id ON mfa_challenges(user_id);
CREATE INDEX idx_mfa_challenges_token ON mfa_challenges(challenge_token);
CREATE INDEX idx_mfa_challenges_expires_at ON mfa_challenges(expires_at);

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
  aadhaar_number VARCHAR(255),    -- Encrypted 12-digit Aadhaar Number
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
-- Tracks all modifications to customer and KYC data, and all login
-- attempts (success and failure) to support RBI audit requirements
-- (US-2, US-7, US-12) and account lockout tracking (US-3, US-8, US-13)
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100),                -- NULL for login/auth events
  record_id UUID,                         -- NULL for login/auth events
  action VARCHAR(100) NOT NULL,           -- INSERT, UPDATE, DELETE, LOGIN_SUCCESS, LOGIN_FAIL, ACCOUNT_LOCKED, etc.
  old_values JSONB,
  new_values JSONB,

  -- Login audit fields (US-2, US-7, US-12)
  user_id VARCHAR(255),                   -- Identified user UUID or email; NULL when user cannot be identified
  ip_address INET,                        -- Client IP address for all audit events
  details TEXT,                           -- Contextual info: 'Invalid Password', 'Unknown Email', 'Account Locked',
                                          -- 'MFA Failed', 'Login Attempt While Locked', 'LOGIN_SUCCESS', etc.
                                          -- Must NOT contain plaintext passwords, MFA codes, or other secrets.

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_ip_address ON audit_logs(ip_address);

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

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Grant appropriate permissions
-- ============================================
-- Note: Adjust username as needed for your setup
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON password_resets TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_challenges TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_forms TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON kyc_submissions TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON pan_hashes TO neondb_owner;
GRANT SELECT, INSERT ON audit_logs TO neondb_owner;

-- Allow seq access for UUID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

COMMIT;