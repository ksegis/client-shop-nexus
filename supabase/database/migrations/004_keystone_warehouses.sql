-- =====================================================
-- PHASE 1 - WEEK 1: KEYSTONE WAREHOUSES TABLE
-- Stores Keystone warehouse information
-- =====================================================

-- Step 1.4: Create Keystone Warehouses Table
-- This table stores warehouse information and shipping details
CREATE TABLE IF NOT EXISTS keystone_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(10),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  phone VARCHAR(20),
  email VARCHAR(255),
  timezone VARCHAR(50),
  business_hours JSONB, -- Store business hours as JSON
  shipping_cutoff_time TIME, -- Daily cutoff time for same-day shipping
  is_active BOOLEAN DEFAULT TRUE,
  supports_dropship BOOLEAN DEFAULT FALSE,
  supports_will_call BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for keystone_warehouses
ALTER TABLE keystone_warehouses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read warehouse data
CREATE POLICY "Authenticated users can read keystone_warehouses" ON keystone_warehouses 
FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin users can modify warehouse data
CREATE POLICY "Admin users can modify keystone_warehouses" ON keystone_warehouses 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add indexes for keystone_warehouses
CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_code ON keystone_warehouses(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_state ON keystone_warehouses(state);
CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_active ON keystone_warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_dropship ON keystone_warehouses(supports_dropship);

-- Add foreign key constraint to keystone_inventory
ALTER TABLE keystone_inventory 
ADD CONSTRAINT fk_keystone_inventory_warehouse 
FOREIGN KEY (warehouse_code) REFERENCES keystone_warehouses(warehouse_code) 
ON DELETE CASCADE;

-- Insert default Keystone warehouses based on documentation
INSERT INTO keystone_warehouses (warehouse_code, name, city, state, supports_dropship, supports_will_call) VALUES
('EAST', 'Eastern Distribution Center', 'Exeter', 'PA', TRUE, TRUE),
('MIDWEST', 'Midwest Distribution Center', 'Kansas City', 'KS', TRUE, TRUE),
('CALIFORNIA', 'California Distribution Center', 'Eastvale', 'CA', TRUE, TRUE),
('SOUTHEAST', 'Southeast Distribution Center', 'Atlanta', 'GA', TRUE, TRUE),
('TEXAS', 'Texas Distribution Center', 'Flower Mound', 'TX', TRUE, TRUE),
('GREAT LAKES', 'Great Lakes Distribution Center', 'Brownstown', 'MI', TRUE, TRUE),
('PACIFIC NORTHWEST', 'Pacific Northwest Distribution Center', 'Spokane', 'WA', TRUE, TRUE),
('FLORIDA', 'Florida Distribution Center', 'Florida', 'FL', TRUE, TRUE)
ON CONFLICT (warehouse_code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE keystone_warehouses IS 'Keystone warehouse locations and shipping information';
COMMENT ON COLUMN keystone_warehouses.warehouse_code IS 'Keystone warehouse identifier code';
COMMENT ON COLUMN keystone_warehouses.business_hours IS 'JSON object containing business hours by day';
COMMENT ON COLUMN keystone_warehouses.shipping_cutoff_time IS 'Daily cutoff time for same-day shipping';
COMMENT ON COLUMN keystone_warehouses.supports_dropship IS 'Whether warehouse supports dropship orders';
COMMENT ON COLUMN keystone_warehouses.supports_will_call IS 'Whether warehouse supports will-call pickup';

