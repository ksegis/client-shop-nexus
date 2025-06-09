-- =====================================================
-- STEP 1: UPDATE USER_ROLE ENUM
-- Add missing roles before running Keystone migrations
-- =====================================================

-- Add shop_manager role to existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'shop_manager';

-- Add shop_user role to existing enum  
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'shop_user';

-- Verify the updated enum values
SELECT unnest(enum_range(NULL::user_role)) as available_roles;

