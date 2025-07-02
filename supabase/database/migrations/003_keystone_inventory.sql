-- =====================================================
-- PHASE 1 - WEEK 1: KEYSTONE INVENTORY TABLE
-- Stores real-time inventory data from Keystone
-- =====================================================

-- Step 1.3: Create Keystone Inventory Table
-- This table stores real-time inventory quantities by warehouse
CREATE TABLE IF NOT EXISTS keystone_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcpn VARCHAR(50) NOT NULL,
  warehouse_code VARCHAR(20) NOT NULL,
  warehouse_name VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 0,
  allocated_quantity INTEGER DEFAULT 0, -- Quantity allocated to pending orders
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - COALESCE(allocated_quantity, 0)) STORED,
  last_updated TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'updated', 'error')),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Composite primary key to ensure one record per part per warehouse
  UNIQUE(vcpn, warehouse_code)
);

-- Add foreign key constraint to keystone_parts
ALTER TABLE keystone_inventory 
ADD CONSTRAINT fk_keystone_inventory_vcpn 
FOREIGN KEY (vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE CASCADE;

-- Add RLS policies for keystone_inventory
ALTER TABLE keystone_inventory ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read inventory data
CREATE POLICY "Authenticated users can read keystone_inventory" ON keystone_inventory 
FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin and shop users can modify inventory data
CREATE POLICY "Admin and shop users can modify keystone_inventory" ON keystone_inventory 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Add indexes for keystone_inventory
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_vcpn ON keystone_inventory(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_warehouse ON keystone_inventory(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_quantity ON keystone_inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_available ON keystone_inventory(available_quantity);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_last_updated ON keystone_inventory(last_updated);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_sync_status ON keystone_inventory(sync_status);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_vcpn_warehouse ON keystone_inventory(vcpn, warehouse_code);

-- Add comments for documentation
COMMENT ON TABLE keystone_inventory IS 'Real-time inventory quantities by warehouse from Keystone';
COMMENT ON COLUMN keystone_inventory.vcpn IS 'Vendor Catalog Part Number';
COMMENT ON COLUMN keystone_inventory.warehouse_code IS 'Keystone warehouse identifier';
COMMENT ON COLUMN keystone_inventory.quantity IS 'Total quantity available at warehouse';
COMMENT ON COLUMN keystone_inventory.allocated_quantity IS 'Quantity allocated to pending orders';
COMMENT ON COLUMN keystone_inventory.available_quantity IS 'Computed available quantity (total - allocated)';
COMMENT ON COLUMN keystone_inventory.sync_status IS 'Status of last synchronization with Keystone';

