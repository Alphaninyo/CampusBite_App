-- Migration: Update Rider role to Food Courier
-- This migration updates the enum and converts existing rider accounts

-- Step 1: Add food_courier to the enum
ALTER TYPE enum_users_role ADD VALUE 'food_courier';

-- Step 2: Update all rider accounts to food_courier
UPDATE users 
SET role = 'food_courier', updated_at = NOW() 
WHERE role = 'rider';

-- Step 3: (Optional) Remove rider from enum after confirming migration
-- ALTER TYPE enum_users_role RENAME TO enum_users_role_old;
-- CREATE TYPE enum_users_role AS ENUM ('consumer', 'vendor', 'food_courier', 'admin');
-- ALTER TABLE users ALTER COLUMN role TYPE enum_users_role USING role::text::enum_users_role;
-- DROP TYPE enum_users_role_old;
