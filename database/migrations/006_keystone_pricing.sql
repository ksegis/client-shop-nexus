-- =====================================================
-- PHASE 1 - WEEK 1: KEYSTONE PRICING TABLE
-- Stores customer-specific pricing from Keystone
-- =====================================================

-- Step 1.6: Create Keystone Pricing Table
-- This table stores customer-specific pricing information
CREATE TABLE IF NOT EXISTS keystone_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  vcpn VARCHAR(50) NOT NULL,
  customer_price DECIMAL(10,2), -- Customer-specific price
  list_price DECIMAL(10,2), -- Standard list price
  core_charge DECIMAL(10,2), -- Core charge if applicable
  price_tier VARCHAR(20), -- Customer's price tier (A, B, C, etc.)
  quantity_breaks JSONB, -- Quantity break pricing as JSON array
  effective_date DATE,
  expiration_date DATE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Composite unique constraint for customer-part pricing
  UNIQUE(customer_id, vcpn)
);

-- Add foreign key constraints
ALTER TABLE keystone_pricing 
ADD CONSTRAINT fk_keystone_pricing_customer 
FOREIGN KEY (customer_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE keystone_pricing 
ADD CONSTRAINT fk_keystone_pricing_vcpn 
FOREIGN KEY (vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE CASCADE;

-- Add RLS policies for keystone_pricing
ALTER TABLE keystone_pricing ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pricing, shop users can see all pricing
CREATE POLICY "Users can access relevant keystone_pricing" ON keystone_pricing 
FOR SELECT USING (
  customer_id = auth.uid() OR
  customer_id IS NULL OR -- Allow access to general pricing
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Only shop users can modify pricing
CREATE POLICY "Shop users can modify keystone_pricing" ON keystone_pricing 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Add indexes for keystone_pricing
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_customer ON keystone_pricing(customer_id);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_vcpn ON keystone_pricing(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_tier ON keystone_pricing(price_tier);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_effective ON keystone_pricing(effective_date);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_expiration ON keystone_pricing(expiration_date);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_updated ON keystone_pricing(last_updated);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_customer_vcpn ON keystone_pricing(customer_id, vcpn);

-- Add comments for documentation
COMMENT ON TABLE keystone_pricing IS 'Customer-specific pricing information from Keystone';
COMMENT ON COLUMN keystone_pricing.customer_price IS 'Customer-specific negotiated price';
COMMENT ON COLUMN keystone_pricing.list_price IS 'Standard list price for reference';
COMMENT ON COLUMN keystone_pricing.core_charge IS 'Core charge amount if part has core';
COMMENT ON COLUMN keystone_pricing.price_tier IS 'Customer price tier (A, B, C, etc.)';
COMMENT ON COLUMN keystone_pricing.quantity_breaks IS 'JSON array of quantity break pricing';

