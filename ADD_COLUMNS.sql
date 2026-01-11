-- ==========================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Add missing columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- Step 2: Update existing patients with sample data (if any exist)
UPDATE patients 
SET 
  phone_number = COALESCE(phone_number, phone),
  gender = 'Not Specified',
  emergency_contact = 'Not Provided',
  blood_group = 'Unknown'
WHERE phone_number IS NULL OR gender IS NULL OR emergency_contact IS NULL OR blood_group IS NULL;

-- Step 3: Drop old columns if they exist
ALTER TABLE patients DROP COLUMN IF EXISTS phone;
ALTER TABLE patients DROP COLUMN IF EXISTS city;
ALTER TABLE patients DROP COLUMN IF EXISTS state;
ALTER TABLE patients DROP COLUMN IF EXISTS zip_code;

-- Step 4: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;
