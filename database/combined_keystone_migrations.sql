-- =====================================================
-- COMBINED KEYSTONE MIGRATIONS FOR SUPABASE
-- All migrations combined into a single file for easy execution
-- =====================================================

-- MIGRATION 001: KEYSTONE CONFIG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS keystone_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(50) NOT NULL,
  security_key_dev TEXT NOT NULL,
  security_key_prod TEXT NOT NULL,
  environment VARCHAR(20) DEFAULT 'development' CHECK (environment IN ('development', 'production')),
  api_endpoint VARCHAR(255) DEFAULT 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx',
  wsdl_url VARCHAR(255) DEFAULT 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx?WSDL',
  approved_ips TEXT[], -- Array of approved IP addresses
  is_active BOOLEAN DEFAULT TRUE,
  ip_approval_status VARCHAR(20) DEFAULT 'pending' CHECK (ip_approval_status IN ('pending', 'approved', 'rejected')),
  ip_approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE keystone_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage keystone_config" ON keystone_config 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_config_active ON keystone_config(is_active);
CREATE INDEX IF NOT EXISTS idx_keystone_config_environment ON keystone_config(environment);

COMMENT ON TABLE keystone_config IS 'Keystone API configuration and credentials';

-- MIGRATION 002: KEYSTONE PARTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS keystone_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcpn VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  manufacturer VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  list_price DECIMAL(10,2) DEFAULT 0,
  weight DECIMAL(8,2),
  dimensions VARCHAR(100),
  features TEXT[],
  compatibility TEXT[],
  superseded_by VARCHAR(50),
  supersedes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE keystone_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read keystone_parts" ON keystone_parts 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Shop users can modify keystone_parts" ON keystone_parts 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_parts_vcpn ON keystone_parts(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_manufacturer ON keystone_parts(manufacturer);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_category ON keystone_parts(category);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_active ON keystone_parts(is_active);

COMMENT ON TABLE keystone_parts IS 'Keystone parts catalog with full part information';

-- MIGRATION 003: KEYSTONE INVENTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS keystone_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcpn VARCHAR(50) NOT NULL,
  warehouse_code VARCHAR(20) NOT NULL,
  quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  allocated_quantity INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vcpn, warehouse_code)
);

ALTER TABLE keystone_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read keystone_inventory" ON keystone_inventory 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Shop users can modify keystone_inventory" ON keystone_inventory 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_inventory_vcpn ON keystone_inventory(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_warehouse ON keystone_inventory(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_quantity ON keystone_inventory(available_quantity);
CREATE INDEX IF NOT EXISTS idx_keystone_inventory_sync_status ON keystone_inventory(sync_status);

COMMENT ON TABLE keystone_inventory IS 'Real-time inventory data from Keystone by warehouse';

-- MIGRATION 004: KEYSTONE WAREHOUSES TABLE
-- =====================================================

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
  business_hours JSONB,
  shipping_cutoff_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  supports_dropship BOOLEAN DEFAULT FALSE,
  supports_will_call BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE keystone_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read keystone_warehouses" ON keystone_warehouses 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin users can modify keystone_warehouses" ON keystone_warehouses 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_code ON keystone_warehouses(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_state ON keystone_warehouses(state);
CREATE INDEX IF NOT EXISTS idx_keystone_warehouses_active ON keystone_warehouses(is_active);

-- Insert default Keystone warehouses
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

COMMENT ON TABLE keystone_warehouses IS 'Keystone warehouse locations and shipping information';

-- MIGRATION 005: KEYSTONE ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS keystone_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID,
  work_order_id UUID,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('jobber', 'dropship')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  ship_to_address JSONB NOT NULL,
  shipping_method VARCHAR(50),
  tracking_number VARCHAR(100),
  estimated_delivery DATE,
  actual_delivery DATE,
  warehouse_code VARCHAR(20),
  keystone_order_id VARCHAR(50),
  customer_po VARCHAR(100),
  keystone_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);

ALTER TABLE keystone_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access relevant keystone_orders" ON keystone_orders 
FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE POLICY "Shop users can modify keystone_orders" ON keystone_orders 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_orders_number ON keystone_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_customer ON keystone_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_status ON keystone_orders(status);
CREATE INDEX IF NOT EXISTS idx_keystone_orders_type ON keystone_orders(order_type);

COMMENT ON TABLE keystone_orders IS 'Orders placed through Keystone API with tracking and status';

-- MIGRATION 006: KEYSTONE PRICING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS keystone_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  vcpn VARCHAR(50) NOT NULL,
  customer_price DECIMAL(10,2),
  list_price DECIMAL(10,2),
  core_charge DECIMAL(10,2),
  price_tier VARCHAR(20),
  quantity_breaks JSONB,
  effective_date DATE,
  expiration_date DATE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, vcpn)
);

ALTER TABLE keystone_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access relevant keystone_pricing" ON keystone_pricing 
FOR SELECT USING (
  customer_id = auth.uid() OR
  customer_id IS NULL OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE POLICY "Shop users can modify keystone_pricing" ON keystone_pricing 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_pricing_customer ON keystone_pricing(customer_id);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_vcpn ON keystone_pricing(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_pricing_customer_vcpn ON keystone_pricing(customer_id, vcpn);

COMMENT ON TABLE keystone_pricing IS 'Customer-specific pricing information from Keystone';

-- MIGRATION 007: ENHANCE EXISTING TABLES
-- =====================================================

-- Enhance existing inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_vcpn VARCHAR(50);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_last_sync TIMESTAMP;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS keystone_sync_status VARCHAR(20) DEFAULT 'not_synced' 
  CHECK (keystone_sync_status IN ('not_synced', 'synced', 'error', 'pending'));

CREATE INDEX IF NOT EXISTS idx_inventory_keystone_vcpn ON inventory(keystone_vcpn);
CREATE INDEX IF NOT EXISTS idx_inventory_keystone_synced ON inventory(keystone_synced);

-- Create keystone_order_items table
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

ALTER TABLE keystone_order_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Shop users can modify keystone_order_items" ON keystone_order_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_order_items_order ON keystone_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_keystone_order_items_vcpn ON keystone_order_items(vcpn);

COMMENT ON TABLE keystone_order_items IS 'Individual line items for Keystone orders with tracking';

-- MIGRATION 008: KEYSTONE SYNC LOGGING
-- =====================================================

CREATE TABLE IF NOT EXISTS keystone_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
      ELSE NULL 
    END
  ) STORED,
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  sync_details JSONB,
  triggered_by VARCHAR(50),
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE keystone_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop users can read keystone_sync_logs" ON keystone_sync_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

CREATE POLICY "Admin users can modify keystone_sync_logs" ON keystone_sync_logs 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_type ON keystone_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_status ON keystone_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_started ON keystone_sync_logs(started_at);

CREATE TABLE IF NOT EXISTS keystone_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_log_id UUID,
  method_name VARCHAR(100) NOT NULL,
  request_data JSONB,
  response_data JSONB,
  response_time_ms INTEGER,
  status_code VARCHAR(50),
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE keystone_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read keystone_api_logs" ON keystone_api_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can insert keystone_api_logs" ON keystone_api_logs 
FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_sync ON keystone_api_logs(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_method ON keystone_api_logs(method_name);
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_success ON keystone_api_logs(success);

COMMENT ON TABLE keystone_sync_logs IS 'Tracks all Keystone synchronization operations with performance metrics';
COMMENT ON TABLE keystone_api_logs IS 'Detailed logs of individual Keystone API calls for debugging';

-- MIGRATION 009: DATABASE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to get total inventory for a part across all warehouses
CREATE OR REPLACE FUNCTION get_keystone_total_inventory(part_vcpn VARCHAR(50))
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(quantity) 
     FROM keystone_inventory 
     WHERE vcpn = part_vcpn),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get available inventory (total - allocated) for a part
CREATE OR REPLACE FUNCTION get_keystone_available_inventory(part_vcpn VARCHAR(50))
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(available_quantity) 
     FROM keystone_inventory 
     WHERE vcpn = part_vcpn),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a part is available in sufficient quantity
CREATE OR REPLACE FUNCTION check_keystone_availability(part_vcpn VARCHAR(50), required_qty INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_keystone_available_inventory(part_vcpn) >= required_qty;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer pricing for a part
CREATE OR REPLACE FUNCTION get_customer_price(customer_uuid UUID, part_vcpn VARCHAR(50))
RETURNS DECIMAL(10,2) AS $$
DECLARE
  price DECIMAL(10,2);
BEGIN
  -- Try to get customer-specific price first
  SELECT customer_price INTO price
  FROM keystone_pricing 
  WHERE customer_id = customer_uuid AND vcpn = part_vcpn
  AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);
  
  -- If no customer-specific price, get general price
  IF price IS NULL THEN
    SELECT customer_price INTO price
    FROM keystone_pricing 
    WHERE customer_id IS NULL AND vcpn = part_vcpn
    AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);
  END IF;
  
  -- If still no price, get list price
  IF price IS NULL THEN
    SELECT list_price INTO price
    FROM keystone_pricing 
    WHERE vcpn = part_vcpn
    AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(price, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update keystone_orders total when items change
CREATE OR REPLACE FUNCTION update_keystone_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_subtotal DECIMAL(10,2);
BEGIN
  -- Calculate new subtotal for the order
  SELECT COALESCE(SUM(line_total), 0) INTO order_subtotal
  FROM keystone_order_items 
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Update the order totals
  UPDATE keystone_orders 
  SET 
    subtotal = order_subtotal,
    total_amount = order_subtotal + COALESCE(shipping_cost, 0) + COALESCE(tax_amount, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on keystone_order_items
DROP TRIGGER IF EXISTS trigger_update_order_totals ON keystone_order_items;
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON keystone_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_keystone_order_totals();

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for relevant tables
DROP TRIGGER IF EXISTS trigger_keystone_config_updated_at ON keystone_config;
CREATE TRIGGER trigger_keystone_config_updated_at
  BEFORE UPDATE ON keystone_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_keystone_orders_updated_at ON keystone_orders;
CREATE TRIGGER trigger_keystone_orders_updated_at
  BEFORE UPDATE ON keystone_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_keystone_order_items_updated_at ON keystone_order_items;
CREATE TRIGGER trigger_keystone_order_items_updated_at
  BEFORE UPDATE ON keystone_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW keystone_parts_with_inventory AS
SELECT 
  p.*,
  COALESCE(inv.total_quantity, 0) as total_inventory,
  COALESCE(inv.available_quantity, 0) as available_inventory,
  COALESCE(inv.warehouse_count, 0) as warehouse_count,
  CASE 
    WHEN COALESCE(inv.available_quantity, 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(inv.available_quantity, 0) <= 5 THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM keystone_parts p
LEFT JOIN (
  SELECT 
    vcpn,
    SUM(quantity) as total_quantity,
    SUM(available_quantity) as available_quantity,
    COUNT(*) as warehouse_count
  FROM keystone_inventory
  GROUP BY vcpn
) inv ON p.vcpn = inv.vcpn;

CREATE OR REPLACE VIEW keystone_orders_summary AS
SELECT 
  o.*,
  p.email as customer_email,
  p.full_name as customer_name,
  COUNT(oi.id) as item_count,
  COALESCE(SUM(oi.quantity), 0) as total_quantity
FROM keystone_orders o
LEFT JOIN profiles p ON o.customer_id = p.id
LEFT JOIN keystone_order_items oi ON o.id = oi.order_id
GROUP BY o.id, p.email, p.full_name;

-- Add foreign key constraints
ALTER TABLE keystone_inventory 
ADD CONSTRAINT fk_keystone_inventory_vcpn 
FOREIGN KEY (vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE CASCADE;

ALTER TABLE keystone_inventory 
ADD CONSTRAINT fk_keystone_inventory_warehouse 
FOREIGN KEY (warehouse_code) REFERENCES keystone_warehouses(warehouse_code) 
ON DELETE CASCADE;

ALTER TABLE keystone_order_items 
ADD CONSTRAINT fk_keystone_order_items_order 
FOREIGN KEY (order_id) REFERENCES keystone_orders(id) 
ON DELETE CASCADE;

ALTER TABLE keystone_order_items 
ADD CONSTRAINT fk_keystone_order_items_vcpn 
FOREIGN KEY (vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE RESTRICT;

ALTER TABLE keystone_pricing 
ADD CONSTRAINT fk_keystone_pricing_vcpn 
FOREIGN KEY (vcpn) REFERENCES keystone_parts(vcpn) 
ON DELETE CASCADE;

ALTER TABLE keystone_api_logs 
ADD CONSTRAINT fk_keystone_api_logs_sync 
FOREIGN KEY (sync_log_id) REFERENCES keystone_sync_logs(id) 
ON DELETE CASCADE;

-- Add comments for functions and views
COMMENT ON FUNCTION get_keystone_total_inventory(VARCHAR) IS 'Returns total inventory quantity across all warehouses for a part';
COMMENT ON FUNCTION get_keystone_available_inventory(VARCHAR) IS 'Returns available inventory (total - allocated) for a part';
COMMENT ON FUNCTION check_keystone_availability(VARCHAR, INTEGER) IS 'Checks if sufficient quantity is available for a part';
COMMENT ON FUNCTION get_customer_price(UUID, VARCHAR) IS 'Gets customer-specific or general pricing for a part';

COMMENT ON VIEW keystone_parts_with_inventory IS 'Parts catalog with aggregated inventory information';
COMMENT ON VIEW keystone_orders_summary IS 'Order summary with customer details and item counts';

