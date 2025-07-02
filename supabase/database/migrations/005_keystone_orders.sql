-- =====================================================
-- PHASE 1 - WEEK 1: KEYSTONE ORDERS TABLE
-- Stores orders placed through Keystone API
-- =====================================================

-- Step 1.5: Create Keystone Orders Table
-- This table stores orders placed through the Keystone API
CREATE TABLE IF NOT EXISTS keystone_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID,
  work_order_id UUID,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('jobber', 'dropship')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed')),
  
  -- Order totals
  subtotal DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Shipping information
  ship_to_address JSONB NOT NULL, -- Store shipping address as JSON
  shipping_method VARCHAR(50),
  tracking_number VARCHAR(100),
  estimated_delivery DATE,
  actual_delivery DATE,
  
  -- Keystone specific fields
  warehouse_code VARCHAR(20),
  keystone_order_id VARCHAR(50), -- Keystone's internal order ID
  customer_po VARCHAR(100), -- Customer purchase order number
  
  -- API response data
  keystone_response JSONB, -- Store full Keystone API response
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE keystone_orders 
ADD CONSTRAINT fk_keystone_orders_customer 
FOREIGN KEY (customer_id) REFERENCES profiles(id) 
ON DELETE SET NULL;

ALTER TABLE keystone_orders 
ADD CONSTRAINT fk_keystone_orders_work_order 
FOREIGN KEY (work_order_id) REFERENCES work_orders(id) 
ON DELETE SET NULL;

ALTER TABLE keystone_orders 
ADD CONSTRAINT fk_keystone_orders_warehouse 
FOREIGN KEY (warehouse_code) REFERENCES keystone_warehouses(warehouse_code) 
ON DELETE SET NULL;

-- Add RLS policies for keystone_orders
ALTER TABLE keystone_orders ENABLE ROW LEVEL SECURITY;

-- Users can see their own orders, shop users can see all orders
CREATE POLICY "Users can access relevant keystone_orders" ON keystone_orders 
FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Only shop users can create/modify orders
CREATE POLICY "Shop users can modify keystone_orders" ON keystone_orders 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Add indexes for keystone_orders
CREATE INDEX IF NOT EXISTS idx_keystone_orders_number ON keystone_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_customer ON keystone_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_work_order ON keystone_orders(work_order_id);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_status ON keystone_orders(status);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_type ON keystone_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_warehouse ON keystone_orders(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_created ON keystone_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_tracking ON keystone_orders(tracking_number);

-- Add comments for documentation
COMMENT ON TABLE keystone_orders IS 'Orders placed through Keystone API with tracking and status';
COMMENT ON COLUMN keystone_orders.order_type IS 'Type of order: jobber (to shop) or dropship (direct to customer)';
COMMENT ON COLUMN keystone_orders.ship_to_address IS 'JSON object containing complete shipping address';
COMMENT ON COLUMN keystone_orders.keystone_response IS 'Full API response from Keystone for debugging';
COMMENT ON COLUMN keystone_orders.customer_po IS 'Customer purchase order number for reference';

