-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR

-- 1. Update patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_profile JSONB;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;

-- 2. Update appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS share_health_profile BOOLEAN DEFAULT false;

-- 3. (Optional) Update existing patients to have is_profile_completed = false
UPDATE patients SET is_profile_completed = false WHERE is_profile_completed IS NULL;
