-- Migration: Create basic_details table
-- Description: Add table for basic user details collection (name, DOB, address)
-- Date: 2026-04-28

-- ============================================
-- Basic Details Table
-- Stores basic user information
-- ============================================
CREATE TABLE IF NOT EXISTS basic_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_basic_details_created_at ON basic_details(created_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON basic_details TO neondb_owner;

COMMIT;
