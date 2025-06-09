-- =====================================================
-- PHASE 1 - WEEK 2: ENHANCE EXISTING TABLES
-- Enhance existing inventory and related tables for Keystone integration
-- =====================================================

-- Step 2.1: Enhance existing inventory table with Keystone fields
-- Add Keystone-specific columns to the existing inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_vcpn VARCHAR(50);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_last_sync TIMESTAMP;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_sync_status VARCHAR(20) DEFAULT 'not_synced' 
  CHECK (keystone_sync_status IN ('not_synced', 'synced', 'error', 'pending'));

-- Add index for Keystone VCPN lookups
CREATE INDEX IF NOT EXISTS idx_inventory_keystone_vcpn ON inventory(keystone_vcpn);
CREATE INDEX IF NOT EXISTS idx_inventory_keystone_synced ON inventory(keystone_synced);
CREATE INDEX IF NOT EXISTS idx_inventory_keystone_sync_status ON inventory(keystone_sync_status);

-- Add foreign key constraint to link with Keystone parts
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_keystone_vcpn 
FOREIGN KEY (keystone_vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE SET NULL;

-- Add comments for new columns
COMMENT ON COLUMN inventory.keystone_vcpn IS 'Link to Keystone VCPN for API synchronization';
COMMENT ON COLUMN inventory.keystone_synced IS 'Whether this item is synchronized with Keystone';
COMMENT ON COLUMN inventory.keystone_last_sync IS 'Last successful sync with Keystone API';
COMMENT ON COLUMN inventory.keystone_sync_status IS 'Current synchronization status with Keystone';

-- Step 2.2: Create Keystone Order Items table
-- This table stores individual line items for Keystone orders
CREATE TABLE IF NOT EXISTS keystone_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  vcpn VARCHAR(50) NOT NULL,
  part_description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  core_charge DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  warehouse_code VARCHAR(20),
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE keystone_order_items 
ADD CONSTRAINT fk_keystone_order_items_order 
FOREIGN KEY (order_id) REFERENCES keystone_orders(id) 
ON DELETE CASCADE;

ALTER TABLE keystone_order_items 
ADD CONSTRAINT fk_keystone_order_items_vcpn 
FOREIGN KEY (vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE RESTRICT;

ALTER TABLE keystone_order_items 
ADD CONSTRAINT fk_keystone_order_items_warehouse 
FOREIGN KEY (warehouse_code) REFERENCES keystone_warehouses(warehouse_code) 
ON DELETE SET NULL;

-- Add RLS policies for keystone_order_items
ALTER TABLE keystone_order_items ENABLE ROW LEVEL SECURITY;

-- Users can see items from their orders, shop users can see all items
CREATE POLICY "Users can access relevant keystone_order_items" ON keystone_order_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM keystone_orders 
    WHERE keystone_orders.id = order_id 
    AND (keystone_orders.customer_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM profiles 
           WHERE profiles.id = auth.uid() 
           AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
         ))
  )
);

-- Only shop users can modify order items
CREATE POLICY "Shop users can modify keystone_order_items" ON keystone_order_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Add indexes for keystone_order_items
CREATE INDEX IF NOT EXISTS idx_keystone_order_items_order ON keystone_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_keystone_order_items_vcpn ON keystone_order_items(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_order_items_status ON keystone_order_items(status);
CREATE INDEX IF NOT EXISTS idx_keystone_order_items_warehouse ON keystone_order_items(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_keystone_order_items_tracking ON keystone_order_items(tracking_number);

-- Add comments for documentation
COMMENT ON TABLE keystone_order_items IS 'Individual line items for Keystone orders with tracking';
COMMENT ON COLUMN keystone_order_items.line_total IS 'Total for this line item (quantity * unit_price + core_charge)';
COMMENT ON COLUMN keystone_order_items.core_charge IS 'Core charge amount for this specific item';

