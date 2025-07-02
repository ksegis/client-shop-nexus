-- =====================================================
-- PHASE 1 - WEEK 2: DATABASE FUNCTIONS AND TRIGGERS
-- Create utility functions and triggers for Keystone integration
-- =====================================================

-- Step 2.5: Create utility functions for Keystone operations

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

-- Step 2.6: Create triggers for automatic updates

-- Trigger function to update keystone_orders total when items change
CREATE OR REPLACE FUNCTION update_keystone_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_subtotal DECIMAL(10,2);
  order_total DECIMAL(10,2);
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

DROP TRIGGER IF EXISTS trigger_keystone_parts_updated_at ON keystone_parts;
CREATE TRIGGER trigger_keystone_parts_updated_at
  BEFORE UPDATE ON keystone_parts
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

-- Step 2.7: Create views for common queries

-- View for parts with inventory summary
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

-- View for order summary with customer information
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

-- Add comments for functions and views
COMMENT ON FUNCTION get_keystone_total_inventory(VARCHAR) IS 'Returns total inventory quantity across all warehouses for a part';
COMMENT ON FUNCTION get_keystone_available_inventory(VARCHAR) IS 'Returns available inventory (total - allocated) for a part';
COMMENT ON FUNCTION check_keystone_availability(VARCHAR, INTEGER) IS 'Checks if sufficient quantity is available for a part';
COMMENT ON FUNCTION get_customer_price(UUID, VARCHAR) IS 'Gets customer-specific or general pricing for a part';

COMMENT ON VIEW keystone_parts_with_inventory IS 'Parts catalog with aggregated inventory information';
COMMENT ON VIEW keystone_orders_summary IS 'Order summary with customer details and item counts';

