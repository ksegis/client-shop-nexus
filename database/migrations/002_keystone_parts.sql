-- =====================================================
-- PHASE 1 - WEEK 1: KEYSTONE PARTS TABLE
-- Stores Keystone parts catalog data
-- =====================================================

-- Step 1.2: Create Keystone Parts Table
-- This table stores the complete parts catalog from Keystone
CREATE TABLE IF NOT EXISTS keystone_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcpn VARCHAR(50) NOT NULL UNIQUE, -- Vendor Catalog Part Number (Keystone's primary identifier)
  manufacturer_part_number VARCHAR(100),
  description TEXT NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  weight DECIMAL(10,2), -- Weight in pounds
  dimensions VARCHAR(100), -- Dimensions as string (e.g., "12x8x6")
  warranty_period VARCHAR(50), -- Warranty period description
  features TEXT[], -- Array of feature strings
  compatibility TEXT[], -- Array of compatible vehicle/engine models
  blocked BOOLEAN DEFAULT FALSE, -- Whether part is blocked from ordering
  superseded_from VARCHAR(50), -- VCPN this part supersedes
  superseded_to VARCHAR(50), -- VCPN this part is superseded by
  image_urls TEXT[], -- Array of image URLs
  document_urls TEXT[], -- Array of document/manual URLs
  hazmat BOOLEAN DEFAULT FALSE, -- Whether part is hazardous material
  core_part BOOLEAN DEFAULT FALSE, -- Whether part has core charge
  kit_part BOOLEAN DEFAULT FALSE, -- Whether part is a kit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_synced TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for keystone_parts
ALTER TABLE keystone_parts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read parts data
CREATE POLICY "Authenticated users can read keystone_parts" ON keystone_parts 
FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin and shop users can modify parts data
CREATE POLICY "Admin and shop users can modify keystone_parts" ON keystone_parts 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Add indexes for keystone_parts
CREATE INDEX IF NOT EXISTS idx_keystone_parts_vcpn ON keystone_parts(vcpn);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_manufacturer_part ON keystone_parts(manufacturer_part_number);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_brand ON keystone_parts(brand);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_category ON keystone_parts(category);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_description ON keystone_parts USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_keystone_parts_blocked ON keystone_parts(blocked);
CREATE INDEX IF NOT EXISTS idx_keystone_parts_last_synced ON keystone_parts(last_synced);

-- Add full-text search index
CREATE INDEX IF NOT EXISTS idx_keystone_parts_search ON keystone_parts 
USING gin(to_tsvector('english', description || ' ' || COALESCE(manufacturer_part_number, '') || ' ' || COALESCE(brand, '')));

-- Add comments for documentation
COMMENT ON TABLE keystone_parts IS 'Complete Keystone parts catalog with detailed specifications';
COMMENT ON COLUMN keystone_parts.vcpn IS 'Vendor Catalog Part Number - Keystone primary identifier';
COMMENT ON COLUMN keystone_parts.manufacturer_part_number IS 'Original manufacturer part number';
COMMENT ON COLUMN keystone_parts.blocked IS 'Whether part is blocked from ordering by Keystone';
COMMENT ON COLUMN keystone_parts.superseded_from IS 'VCPN that this part replaces';
COMMENT ON COLUMN keystone_parts.superseded_to IS 'VCPN that replaces this part';
COMMENT ON COLUMN keystone_parts.features IS 'Array of part features and specifications';
COMMENT ON COLUMN keystone_parts.compatibility IS 'Array of compatible vehicle/engine models';

