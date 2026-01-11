-- Add missing columns to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- Drop old columns if they exist
ALTER TABLE patients 
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS zip_code;
