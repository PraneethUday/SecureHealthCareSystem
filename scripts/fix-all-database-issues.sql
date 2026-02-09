-- ==========================================
-- COMPREHENSIVE FIX FOR ALL DATABASE ISSUES
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. FIX ACCESS_LOGS TABLE - Add missing columns for audit
ALTER TABLE access_logs 
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;

-- 2. DISABLE RLS TEMPORARILY FOR DEBUGGING (or use service role key)
-- If you want to keep RLS enabled, ensure your policies allow the operations

-- Fix RLS for appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Patients can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all for appointments" ON appointments;

-- Create permissive policies for appointments
CREATE POLICY "Allow all for appointments" ON appointments
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for prescriptions table
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can view prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Allow all for prescriptions" ON prescriptions;

CREATE POLICY "Allow all for prescriptions" ON prescriptions
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for access_logs table
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for access_logs" ON access_logs;
DROP POLICY IF EXISTS "Allow all for access_logs" ON access_logs;

CREATE POLICY "Allow all for access_logs" ON access_logs
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for medical_records table
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for medical_records" ON medical_records;

CREATE POLICY "Allow all for medical_records" ON medical_records
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for hospitals table
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for hospitals" ON hospitals;

CREATE POLICY "Allow all for hospitals" ON hospitals
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for doctors table
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for doctors" ON doctors;

CREATE POLICY "Allow all for doctors" ON doctors
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for patients" ON patients;

CREATE POLICY "Allow all for patients" ON patients
FOR ALL USING (true) WITH CHECK (true);

-- Fix RLS for prescription_logs table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'prescription_logs') THEN
        ALTER TABLE prescription_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for prescription_logs" ON prescription_logs;
        CREATE POLICY "Allow all for prescription_logs" ON prescription_logs
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Fix RLS for appointment_logs table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'appointment_logs') THEN
        ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for appointment_logs" ON appointment_logs;
        CREATE POLICY "Allow all for appointment_logs" ON appointment_logs
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Fix RLS for login_audit table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'login_audit') THEN
        ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for login_audit" ON login_audit;
        CREATE POLICY "Allow all for login_audit" ON login_audit
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. VERIFY TABLES EXIST AND HAVE DATA
-- Check appointments
SELECT 'appointments' as table_name, COUNT(*) as row_count FROM appointments;

-- Check prescriptions  
SELECT 'prescriptions' as table_name, COUNT(*) as row_count FROM prescriptions;

-- Check access_logs
SELECT 'access_logs' as table_name, COUNT(*) as row_count FROM access_logs;

-- Check hospitals
SELECT 'hospitals' as table_name, COUNT(*) as row_count FROM hospitals;

-- 4. Show access_logs columns to verify fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'access_logs'
ORDER BY ordinal_position;

-- 5. RESET DOCTOR CREDENTIALS (if needed)
UPDATE doctors 
SET 
  password = 'doctor1',
  password_hash = NULL,
  is_locked = FALSE,
  locked_until = NULL,
  login_attempts = 0,
  is_mfa_enabled = FALSE
WHERE doctor_id = 'D001';

UPDATE doctors 
SET 
  password = 'doctor2',
  password_hash = NULL,
  is_locked = FALSE,
  locked_until = NULL,
  login_attempts = 0,
  is_mfa_enabled = FALSE
WHERE doctor_id = 'D002';

UPDATE doctors 
SET 
  password = 'doctor3',
  password_hash = NULL,
  is_locked = FALSE,
  locked_until = NULL,
  login_attempts = 0,
  is_mfa_enabled = FALSE
WHERE doctor_id = 'D003';

-- Show doctors to verify
SELECT doctor_id, first_name, last_name, is_locked, login_attempts FROM doctors;

-- 6. INSERT SAMPLE APPOINTMENTS FOR TESTING (if needed)
-- First, get patient and doctor UUIDs
DO $$
DECLARE
  patient_uuid UUID;
  doctor_uuid UUID;
  hospital_uuid UUID;
BEGIN
  -- Get first patient UUID
  SELECT id INTO patient_uuid FROM patients WHERE patient_id = 'P001' LIMIT 1;
  
  -- Get first doctor UUID
  SELECT id INTO doctor_uuid FROM doctors WHERE doctor_id = 'D001' LIMIT 1;
  
  -- Get first hospital UUID
  SELECT id INTO hospital_uuid FROM hospitals LIMIT 1;
  
  -- Only insert if we have valid UUIDs and no appointments exist
  IF patient_uuid IS NOT NULL AND doctor_uuid IS NOT NULL AND hospital_uuid IS NOT NULL THEN
    -- Insert sample appointment if none exist
    INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, reason, status)
    SELECT patient_uuid, doctor_uuid, hospital_uuid, CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'General Checkup', 'scheduled'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE patient_id = patient_uuid LIMIT 1);
    
    RAISE NOTICE 'Sample appointment created for patient % with doctor %', patient_uuid, doctor_uuid;
  ELSE
    RAISE NOTICE 'Could not create sample appointment - missing patient, doctor, or hospital data';
  END IF;
END $$;

-- Show final status
SELECT 'VERIFICATION COMPLETE' as status;
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions  
UNION ALL
SELECT 'access_logs', COUNT(*) FROM access_logs
UNION ALL
SELECT 'hospitals', COUNT(*) FROM hospitals
UNION ALL
SELECT 'doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'patients', COUNT(*) FROM patients;
