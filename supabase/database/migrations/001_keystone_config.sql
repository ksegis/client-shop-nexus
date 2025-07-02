-- =====================================================
-- PHASE 1 - WEEK 1: KEYSTONE DATABASE TABLES
-- Custom Truck Connections - Keystone Integration
-- =====================================================

-- Step 1.1: Create Keystone Configuration Table
-- This table stores Keystone API configuration and credentials
CREATE TABLE IF NOT EXISTS keystone_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(10) NOT NULL,
  security_key_dev TEXT NOT NULL,
  security_key_prod TEXT NOT NULL,
  approved_ips TEXT[] NOT NULL DEFAULT '{}',
  environment VARCHAR(20) DEFAULT 'development' CHECK (environment IN ('development', 'production')),
  is_active BOOLEAN DEFAULT FALSE,
  last_tested TIMESTAMP,
  api_endpoint VARCHAR(255) DEFAULT 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx',
  wsdl_url VARCHAR(255) DEFAULT 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx?WSDL',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for keystone_config
ALTER TABLE keystone_config ENABLE ROW LEVEL SECURITY;

-- Only admin users can access Keystone configuration
CREATE POLICY "Admin access only for keystone_config" ON keystone_config 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add indexes for keystone_config
CREATE INDEX IF NOT EXISTS idx_keystone_config_active ON keystone_config(is_active);
CREATE INDEX IF NOT EXISTS idx_keystone_config_environment ON keystone_config(environment);

-- Add comments for documentation
COMMENT ON TABLE keystone_config IS 'Stores Keystone API configuration and authentication credentials';
COMMENT ON COLUMN keystone_config.account_number IS 'Keystone customer account number (5-7 digits)';
COMMENT ON COLUMN keystone_config.security_key_dev IS 'Development environment security key (36-byte hex string)';
COMMENT ON COLUMN keystone_config.security_key_prod IS 'Production environment security key (36-byte hex string)';
COMMENT ON COLUMN keystone_config.approved_ips IS 'Array of IP addresses approved by Keystone';
COMMENT ON COLUMN keystone_config.is_active IS 'Whether this configuration is currently active';

