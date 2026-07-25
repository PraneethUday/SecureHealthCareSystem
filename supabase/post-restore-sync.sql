-- ============================================================================
-- POST-RESTORE SCHEMA SYNC
-- ============================================================================
-- Generated 2026-07-25 -- run ONCE in the Supabase SQL Editor against
-- the freshly-restored project.
--
-- WHY THIS EXISTS:
-- db_cluster-22-01-2026@20-35-49.backup.gz is a snapshot from 2026-01-22.
-- Every schema file below was written and applied to the OLD project AFTER
-- that date (2026-02-06 through 2026-03-11), via ad-hoc SQL Editor runs --
-- this repo has no Supabase CLI migration history, so none of those changes
-- were captured in the backup. Restoring the backup into a new project
-- therefore recreates the database exactly as it was on 2026-01-22: missing
-- MFA/OTP, account lockout, chat, vitals, notifications, doctor/nurse/staff
-- hospital links, and security monitoring -- which is exactly why the app
-- was throwing PGRST202 (missing function) and PGRST204 (missing column).
--
-- Almost every statement below is idempotent (IF NOT EXISTS / CREATE OR
-- REPLACE / DROP ... IF EXISTS first) so it's safe to run against this
-- partially-synced database. A handful of CREATE POLICY statements have no
-- guard, so re-running the whole script a SECOND time will error with
-- "policy already exists" on those lines -- harmless, just means that part
-- already applied; skip and continue. Order matters -- do not reorder
-- these sections.
--
-- NOT included on purpose:
--   * complete-setup.sql -- redundant with schema.sql (already applied) and
--     defines a second, unused lockout system (increment_login_attempts /
--     reset_login_attempts) that the app code never calls.
--   * reset-admin-password.sql -- resets the admin password to a fixed
--     value; a credential change you should run deliberately, not bundled.
--   * migrations/create_vitals_table.sql -- deprecated/dead, see its header.
-- ============================================================================

-- ============================================================================
-- SOURCE: fix-audit-schema.sql
-- ============================================================================
-- Add missing columns to access_logs for the centralized audit logger
ALTER TABLE access_logs 
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- SOURCE: make-password-nullable.sql
-- ============================================================================
-- Migration to make password column nullable
-- This allows supporting the transition to password_hash without breaking inserts that don't provide a plaintext password

ALTER TABLE patients ALTER COLUMN password DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN password DROP NOT NULL;
ALTER TABLE nurses ALTER COLUMN password DROP NOT NULL;
ALTER TABLE staff ALTER COLUMN password DROP NOT NULL;
ALTER TABLE admins ALTER COLUMN password DROP NOT NULL;

-- ============================================================================
-- SOURCE: auth-mfa-schema.sql
-- ============================================================================
-- ============================================================================
-- SECURE AUTHENTICATION SYSTEM - MFA & PASSWORD ENCRYPTION
-- ============================================================================
-- This migration adds OTP-based multi-factor authentication and updates
-- password storage to use encrypted hashes instead of plaintext
-- ============================================================================

-- 1. Create OTP verification logs table
CREATE TABLE IF NOT EXISTS otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempts INTEGER DEFAULT 0,
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- 2. Create indexes for OTP logs
CREATE INDEX IF NOT EXISTS idx_otp_logs_user_id ON otp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_logs_user_role ON otp_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires_at ON otp_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON otp_logs(created_at);

-- 3. Update patients table to support MFA
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mfa_method TEXT DEFAULT 'email', -- 'email', 'sms', 'app'
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 4. Update doctors table to support MFA
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mfa_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 5. Update nurses table to support MFA
ALTER TABLE nurses 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mfa_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 6. Update staff table to support MFA
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mfa_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 7. Update admins table to support MFA
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mfa_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 8. Create login audit table for security tracking
CREATE TABLE IF NOT EXISTS login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  login_status TEXT NOT NULL, -- 'success', 'failed_password', 'failed_mfa', 'account_locked'
  ip_address TEXT,
  user_agent TEXT,
  mfa_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Create indexes for login audit
CREATE INDEX IF NOT EXISTS idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON login_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_login_audit_status ON login_audit(login_status);

-- 10. Create password history table for security policies
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Create indexes for password history
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_changed_at ON password_history(changed_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- OTP logs - patients can only view their own OTP logs
CREATE POLICY "Patients can view own OTP logs" ON otp_logs
  FOR SELECT USING (
    user_role = 'patient' AND user_id = auth.uid()::text
  );

-- OTP logs - admins can view all OTP logs
CREATE POLICY "Admins can view all OTP logs" ON otp_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()::text)
  );

-- Login audit - users can view their own login history
CREATE POLICY "Users can view own login history" ON login_audit
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()::text)
  );

-- Password history - users cannot directly access (admin only)
CREATE POLICY "Admins can view password history" ON password_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()::text)
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to increment login attempts
CREATE OR REPLACE FUNCTION increment_login_attempts(
  user_id TEXT,
  user_table TEXT
) RETURNS void AS $$
BEGIN
  CASE user_table
    WHEN 'patients' THEN
      UPDATE patients SET login_attempts = login_attempts + 1 WHERE patient_id = user_id;
    WHEN 'doctors' THEN
      UPDATE doctors SET login_attempts = login_attempts + 1 WHERE doctor_id = user_id;
    WHEN 'nurses' THEN
      UPDATE nurses SET login_attempts = login_attempts + 1 WHERE nurse_id = user_id;
    WHEN 'staff' THEN
      UPDATE staff SET login_attempts = login_attempts + 1 WHERE staff_id = user_id;
    WHEN 'admins' THEN
      UPDATE admins SET login_attempts = login_attempts + 1 WHERE id = user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset login attempts
CREATE OR REPLACE FUNCTION reset_login_attempts(
  user_id TEXT,
  user_table TEXT
) RETURNS void AS $$
BEGIN
  CASE user_table
    WHEN 'patients' THEN
      UPDATE patients SET login_attempts = 0, is_locked = FALSE WHERE patient_id = user_id;
    WHEN 'doctors' THEN
      UPDATE doctors SET login_attempts = 0, is_locked = FALSE WHERE doctor_id = user_id;
    WHEN 'nurses' THEN
      UPDATE nurses SET login_attempts = 0, is_locked = FALSE WHERE nurse_id = user_id;
    WHEN 'staff' THEN
      UPDATE staff SET login_attempts = 0, is_locked = FALSE WHERE staff_id = user_id;
    WHEN 'admins' THEN
      UPDATE admins SET login_attempts = 0, is_locked = FALSE WHERE id = user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to lock account after failed attempts
CREATE OR REPLACE FUNCTION lock_account_after_failed_attempts(
  user_id TEXT,
  user_table TEXT,
  max_attempts INTEGER DEFAULT 5
) RETURNS void AS $$
DECLARE
  current_attempts INTEGER;
  lock_duration INTERVAL := '30 minutes';
BEGIN
  CASE user_table
    WHEN 'patients' THEN
      SELECT login_attempts INTO current_attempts FROM patients WHERE patient_id = user_id;
      IF current_attempts >= max_attempts THEN
        UPDATE patients 
        SET is_locked = TRUE, locked_until = NOW() + lock_duration 
        WHERE patient_id = user_id;
      END IF;
    WHEN 'doctors' THEN
      SELECT login_attempts INTO current_attempts FROM doctors WHERE doctor_id = user_id;
      IF current_attempts >= max_attempts THEN
        UPDATE doctors 
        SET is_locked = TRUE, locked_until = NOW() + lock_duration 
        WHERE doctor_id = user_id;
      END IF;
    WHEN 'nurses' THEN
      SELECT login_attempts INTO current_attempts FROM nurses WHERE nurse_id = user_id;
      IF current_attempts >= max_attempts THEN
        UPDATE nurses 
        SET is_locked = TRUE, locked_until = NOW() + lock_duration 
        WHERE nurse_id = user_id;
      END IF;
    WHEN 'staff' THEN
      SELECT login_attempts INTO current_attempts FROM staff WHERE staff_id = user_id;
      IF current_attempts >= max_attempts THEN
        UPDATE staff 
        SET is_locked = TRUE, locked_until = NOW() + lock_duration 
        WHERE staff_id = user_id;
      END IF;
    WHEN 'admins' THEN
      SELECT login_attempts INTO current_attempts FROM admins WHERE id = user_id;
      IF current_attempts >= max_attempts THEN
        UPDATE admins 
        SET is_locked = TRUE, locked_until = NOW() + lock_duration 
        WHERE id = user_id;
      END IF;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this comment without errors, the migration was successful!
-- Now run the migration in Supabase SQL Editor

-- ============================================================================
-- SOURCE: account-lockout-schema.sql
-- ============================================================================
-- ==========================================
-- ACCOUNT LOCKOUT & SECURITY SYSTEM
-- Tracks failed login attempts and locks accounts
-- ==========================================

-- Drop existing objects
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS account_locks CASCADE;

-- ==========================================
-- LOGIN ATTEMPTS TABLE
-- Tracks all login attempts (successful and failed)
-- ==========================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- The username/email/ID used in login attempt
  user_role TEXT NOT NULL, -- 'patient', 'doctor', 'nurse', 'staff', 'admin'
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('success', 'failed')),
  failure_reason TEXT, -- 'invalid_password', 'account_locked', 'user_not_found'
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Index for quick lookups
  CONSTRAINT login_attempts_check CHECK (
    (attempt_type = 'failed' AND failure_reason IS NOT NULL) OR
    (attempt_type = 'success' AND failure_reason IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at DESC);
CREATE INDEX idx_login_attempts_user_role ON login_attempts(user_role);
CREATE INDEX idx_login_attempts_type ON login_attempts(attempt_type);

-- ==========================================
-- ACCOUNT LOCKS TABLE
-- Tracks locked accounts
-- ==========================================
CREATE TABLE IF NOT EXISTS account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- The locked username/email/ID
  user_role TEXT NOT NULL, -- 'patient', 'doctor', 'nurse', 'staff', 'admin'
  failed_attempts_count INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL, -- Auto-unlock time (3 minutes from lock)
  is_manually_locked BOOLEAN DEFAULT false, -- If admin manually locked
  unlocked_by_admin_id TEXT, -- Admin who unlocked (if applicable)
  unlocked_at TIMESTAMP WITH TIME ZONE,
  lock_reason TEXT DEFAULT 'Too many failed login attempts',
  
  -- Ensure locked_until is after locked_at
  CONSTRAINT valid_lock_period CHECK (locked_until > locked_at)
);

-- Indexes
CREATE INDEX idx_account_locks_user_id ON account_locks(user_id);
CREATE INDEX idx_account_locks_locked_until ON account_locks(locked_until);
CREATE INDEX idx_account_locks_is_manually_locked ON account_locks(is_manually_locked);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to check if account is currently locked
CREATE OR REPLACE FUNCTION is_account_locked(
  p_user_id TEXT,
  p_user_role TEXT
) RETURNS TABLE(
  is_locked BOOLEAN,
  locked_until TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER,
  lock_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_locked,
    al.locked_until,
    al.failed_attempts_count,
    al.lock_reason
  FROM account_locks al
  WHERE al.user_id = p_user_id 
    AND al.user_role = p_user_role
    AND (
      al.locked_until > TIMEZONE('utc', NOW()) OR -- Still within auto-lock period
      al.is_manually_locked = true -- Manually locked by admin
    )
  LIMIT 1;
  
  -- If no lock found, return not locked
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMP WITH TIME ZONE, 0, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent failed attempts count
CREATE OR REPLACE FUNCTION get_recent_failed_attempts(
  p_user_id TEXT,
  p_user_role TEXT,
  p_minutes INTEGER DEFAULT 15 -- Look back 15 minutes
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM login_attempts
  WHERE user_id = p_user_id
    AND user_role = p_user_role
    AND attempt_type = 'failed'
    AND attempted_at > (TIMEZONE('utc', NOW()) - INTERVAL '1 minute' * p_minutes);
    
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to record login attempt and handle locking
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_user_id TEXT,
  p_user_role TEXT,
  p_attempt_type TEXT,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE(
  should_lock BOOLEAN,
  failed_count INTEGER,
  locked_until TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_failed_count INTEGER;
  v_lock_duration INTERVAL := INTERVAL '3 minutes';
  v_max_attempts INTEGER := 5;
  v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Insert the login attempt
  INSERT INTO login_attempts (
    user_id, user_role, attempt_type, failure_reason, ip_address, user_agent
  ) VALUES (
    p_user_id, p_user_role, p_attempt_type, p_failure_reason, p_ip_address, p_user_agent
  );
  
  -- If successful login, clear any existing non-manual locks
  IF p_attempt_type = 'success' THEN
    DELETE FROM account_locks 
    WHERE user_id = p_user_id 
      AND user_role = p_user_role 
      AND is_manually_locked = false;
    
    RETURN QUERY SELECT false, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Count recent failed attempts (last 15 minutes)
  v_failed_count := get_recent_failed_attempts(p_user_id, p_user_role, 15);
  
  -- Check if we should lock the account
  IF v_failed_count >= v_max_attempts THEN
    v_locked_until := TIMEZONE('utc', NOW()) + v_lock_duration;
    
    -- Insert or update account lock
    INSERT INTO account_locks (
      user_id, user_role, failed_attempts_count, locked_until, is_manually_locked
    ) VALUES (
      p_user_id, p_user_role, v_failed_count, v_locked_until, false
    )
    ON CONFLICT (user_id) DO UPDATE SET
      failed_attempts_count = v_failed_count,
      locked_at = TIMEZONE('utc', NOW()),
      locked_until = v_locked_until,
      is_manually_locked = false,
      unlocked_by_admin_id = NULL,
      unlocked_at = NULL;
    
    RETURN QUERY SELECT true, v_failed_count, v_locked_until;
  ELSE
    RETURN QUERY SELECT false, v_failed_count, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to unlock account
CREATE OR REPLACE FUNCTION admin_unlock_account(
  p_user_id TEXT,
  p_user_role TEXT,
  p_admin_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE account_locks
  SET 
    is_manually_locked = false,
    unlocked_by_admin_id = p_admin_id,
    unlocked_at = TIMEZONE('utc', NOW())
  WHERE user_id = p_user_id 
    AND user_role = p_user_role;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to manually lock account (admin action)
CREATE OR REPLACE FUNCTION admin_lock_account(
  p_user_id TEXT,
  p_user_role TEXT,
  p_admin_id TEXT,
  p_reason TEXT DEFAULT 'Manually locked by administrator'
) RETURNS BOOLEAN AS $$
DECLARE
  v_locked_until TIMESTAMP WITH TIME ZONE := TIMEZONE('utc', NOW()) + INTERVAL '100 years'; -- Effectively permanent
BEGIN
  INSERT INTO account_locks (
    user_id, user_role, failed_attempts_count, locked_until, is_manually_locked, lock_reason
  ) VALUES (
    p_user_id, p_user_role, 0, v_locked_until, true, p_reason
  )
  ON CONFLICT (user_id) DO UPDATE SET
    locked_at = TIMEZONE('utc', NOW()),
    locked_until = v_locked_until,
    is_manually_locked = true,
    lock_reason = p_reason,
    unlocked_by_admin_id = NULL,
    unlocked_at = NULL;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CLEANUP FUNCTION
-- Remove old login attempts and expired locks
-- ==========================================
CREATE OR REPLACE FUNCTION cleanup_old_security_data() RETURNS void AS $$
BEGIN
  -- Delete login attempts older than 90 days
  DELETE FROM login_attempts 
  WHERE attempted_at < TIMEZONE('utc', NOW()) - INTERVAL '90 days';
  
  -- Delete expired non-manual locks
  DELETE FROM account_locks 
  WHERE locked_until < TIMEZONE('utc', NOW()) 
    AND is_manually_locked = false;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_locks ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Only admins can view login attempts"
  ON login_attempts FOR SELECT
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- Allow system to insert login attempts
CREATE POLICY "Allow system to insert login attempts"
  ON login_attempts FOR INSERT
  WITH CHECK (true);

-- Only admins can view account locks
CREATE POLICY "Only admins can view account locks"
  ON account_locks FOR SELECT
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- Allow system to manage account locks
CREATE POLICY "Allow system to manage account locks"
  ON account_locks FOR ALL
  USING (true);

-- ==========================================
-- COMMENTS
-- ==========================================
COMMENT ON TABLE login_attempts IS 'Tracks all login attempts for security monitoring';
COMMENT ON TABLE account_locks IS 'Manages locked accounts due to failed login attempts';
COMMENT ON FUNCTION is_account_locked IS 'Check if an account is currently locked';
COMMENT ON FUNCTION record_login_attempt IS 'Record a login attempt and auto-lock if threshold exceeded';
COMMENT ON FUNCTION admin_unlock_account IS 'Admin function to unlock a locked account';
COMMENT ON FUNCTION admin_lock_account IS 'Admin function to manually lock an account';

-- ============================================================================
-- SOURCE: fix-doctor-security.sql
-- ============================================================================
-- ============================================================================
-- ENFORCE DOCTOR SECURITY POLICIES (MFA & PASSWORD Rotations)
-- ============================================================================
-- This script ensures all doctors have MFA enabled and forces a password 
-- update for any accounts still using legacy plaintext formats.
-- ============================================================================

-- 1. Enable MFA for all doctors (unless explicitly disabled by admin)
UPDATE doctors 
SET is_mfa_enabled = TRUE,
    mfa_method = 'email'
WHERE is_mfa_enabled IS NULL OR is_mfa_enabled = FALSE;

-- 2. Force password update for legacy accounts
-- If a doctor has a plaintext 'password' but no 'password_hash', 
-- or if 'password_changed_at' is NULL, they will be forced to change it on next login.
UPDATE doctors
SET password_changed_at = NULL
WHERE (password IS NOT NULL AND password_hash IS NULL)
   OR password_changed_at IS NULL;

-- 3. Reset login attempts for a fresh start
UPDATE doctors
SET login_attempts = 0,
    is_locked = FALSE,
    locked_until = NULL;

-- 4. Audit the cleanup
INSERT INTO access_logs (user_role, user_id, action, resource_type, timestamp)
VALUES ('admin', 'system', 'enforced_doctor_security_parity', 'doctors_table', NOW());

-- ============================================================================
-- SOURCE: doctor-hospitals-schema.sql
-- ============================================================================
-- ==========================================
-- DOCTOR-HOSPITAL ASSOCIATION SCHEMA
-- Links doctors to specific hospitals
-- ==========================================

-- Drop existing table if exists
DROP TABLE IF EXISTS doctor_hospitals CASCADE;

-- Create doctor_hospitals junction table
CREATE TABLE IF NOT EXISTS doctor_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,  -- Is this the doctor's primary hospital?
  consultation_fee DECIMAL(10, 2),    -- Fee at this hospital
  available_days TEXT[],              -- ['Monday', 'Tuesday', etc.]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_doctor_hospital UNIQUE (doctor_id, hospital_id)
);

-- Create indexes
CREATE INDEX idx_doctor_hospitals_doctor ON doctor_hospitals(doctor_id);
CREATE INDEX idx_doctor_hospitals_hospital ON doctor_hospitals(hospital_id);

-- Enable RLS
ALTER TABLE doctor_hospitals ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for appointment booking)
CREATE POLICY "Allow read access to doctor_hospitals"
  ON doctor_hospitals FOR SELECT
  USING (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read doctor_hospitals"
  ON doctor_hospitals FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================================
-- SOURCE: nurse-staff-hospitals-schema.sql
-- ============================================================================
-- ==========================================
-- NURSE-HOSPITAL & STAFF-HOSPITAL ASSOCIATION SCHEMA
-- Links nurses and staff to specific hospitals
-- (Same pattern as doctor_hospitals)
-- ==========================================

-- ==========================================
-- NURSE-HOSPITAL JUNCTION TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS nurse_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_nurse_hospital UNIQUE (nurse_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_hospitals_nurse ON nurse_hospitals(nurse_id);
CREATE INDEX IF NOT EXISTS idx_nurse_hospitals_hospital ON nurse_hospitals(hospital_id);

ALTER TABLE nurse_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to nurse_hospitals"
  ON nurse_hospitals FOR SELECT
  USING (true);

-- ==========================================
-- STAFF-HOSPITAL JUNCTION TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS staff_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_staff_hospital UNIQUE (staff_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_hospitals_staff ON staff_hospitals(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_hospitals_hospital ON staff_hospitals(hospital_id);

ALTER TABLE staff_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to staff_hospitals"
  ON staff_hospitals FOR SELECT
  USING (true);

-- ==========================================
-- UPDATE AUTO-ASSIGN NURSE TRIGGER
-- Only assign nurses from the SAME hospital
-- ==========================================

CREATE OR REPLACE FUNCTION auto_assign_nurse_to_appointment()
RETURNS TRIGGER AS $$
DECLARE
  assigned_nurse_id UUID;
  doctor_department TEXT;
  appointment_hospital_id UUID;
BEGIN
  -- Get the doctor's department
  SELECT department INTO doctor_department
  FROM doctors
  WHERE id = NEW.doctor_id;

  -- Get the appointment's hospital
  appointment_hospital_id := NEW.hospital_id;

  -- Find an available nurse in the same department AND same hospital
  SELECT n.id INTO assigned_nurse_id
  FROM nurses n
  INNER JOIN nurse_hospitals nh ON nh.nurse_id = n.id
  LEFT JOIN appointments a ON a.nurse_id = n.id 
    AND a.appointment_date = NEW.appointment_date
    AND a.status = 'scheduled'
  WHERE n.department = doctor_department
    AND nh.hospital_id = appointment_hospital_id
  GROUP BY n.id
  ORDER BY COUNT(a.id) ASC, RANDOM()
  LIMIT 1;

  -- If no nurse found in same department + hospital, try same hospital any department
  IF assigned_nurse_id IS NULL THEN
    SELECT n.id INTO assigned_nurse_id
    FROM nurses n
    INNER JOIN nurse_hospitals nh ON nh.nurse_id = n.id
    LEFT JOIN appointments a ON a.nurse_id = n.id 
      AND a.appointment_date = NEW.appointment_date
      AND a.status = 'scheduled'
    WHERE nh.hospital_id = appointment_hospital_id
    GROUP BY n.id
    ORDER BY COUNT(a.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  -- If found, assign the nurse
  IF assigned_nurse_id IS NOT NULL THEN
    NEW.nurse_id := assigned_nurse_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS auto_assign_nurse_trigger ON appointments;
CREATE TRIGGER auto_assign_nurse_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_nurse_to_appointment();

-- ============================================================================
-- SOURCE: fix-medical-report-logs-fk.sql
-- ============================================================================
-- ==========================================
-- FIX: Medical Report Logs Foreign Key Issue
-- ==========================================
-- This fixes the error where deleting a medical report fails because
-- the trigger tries to insert a log entry after the report is deleted,
-- but the foreign key constraint prevents it.

-- Solution: Remove the foreign key constraint so logs persist after deletion

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE medical_report_logs DROP CONSTRAINT IF EXISTS medical_report_logs_report_id_fkey;

-- Step 2: Add a comment explaining why there's no FK constraint
COMMENT ON COLUMN medical_report_logs.report_id IS 'UUID of the report (no FK constraint to preserve delete logs)';

-- Step 3: Recreate the trigger to use BEFORE DELETE for better reliability
CREATE OR REPLACE FUNCTION log_medical_report_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO medical_report_logs (
      report_id,
      action_type,
      performed_by_user_id,
      performed_by_role,
      metadata
    ) VALUES (
      NEW.id,
      'uploaded',
      NEW.uploaded_by_user_id,
      NEW.uploaded_by_role,
      jsonb_build_object(
        'report_name', NEW.report_name,
        'report_type', NEW.report_type,
        'file_size', NEW.file_size
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO medical_report_logs (
      report_id,
      action_type,
      performed_by_user_id,
      performed_by_role,
      metadata
    ) VALUES (
      OLD.id,
      'deleted',
      OLD.uploaded_by_user_id,
      OLD.uploaded_by_role,
      jsonb_build_object(
        'report_name', OLD.report_name,
        'report_type', OLD.report_type
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate trigger with proper timing
DROP TRIGGER IF EXISTS log_medical_report_action_trigger ON medical_reports;
CREATE TRIGGER log_medical_report_action_trigger
  BEFORE INSERT OR DELETE ON medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION log_medical_report_action();

-- Verification
SELECT 'Medical report logs FK constraint fix applied successfully!' as message;

-- ============================================================================
-- SOURCE: chat-feature-tables.sql
-- ============================================================================
-- ========================================================================================================
-- CHAT FEATURE - DATABASE MIGRATION
-- Run this in Supabase SQL Editor to add chat functionality
-- This ONLY creates new tables - does NOT modify any existing tables or data
-- ========================================================================================================
-- Version: 1.0
-- Last Updated: 2026-02-19
-- ========================================================================================================

-- Enable required extensions (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ######################################################################################################
-- SECTION 1: CHAT TABLES
-- ######################################################################################################

-- Chat Conversations table
-- Links a chat session to an appointment between a patient and doctor
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_appointment_conversation UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_appointment ON chat_conversations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_patient ON chat_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_doctor ON chat_conversations(doctor_id);


-- Chat Messages table
-- Stores individual messages within a conversation
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(conversation_id, is_read) WHERE is_read = FALSE;


-- Chat Attachments table
-- Stores file attachments linked to messages (max 10MB per file)
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_attachment_size CHECK (file_size > 0 AND file_size <= 10485760)
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);


-- ######################################################################################################
-- SECTION 2: ROW LEVEL SECURITY (RLS)
-- ######################################################################################################

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- Permissive policies (app handles authorization via service role key)
DROP POLICY IF EXISTS "Allow all chat conversation operations" ON chat_conversations;
CREATE POLICY "Allow all chat conversation operations" ON chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat message operations" ON chat_messages;
CREATE POLICY "Allow all chat message operations" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat attachment operations" ON chat_attachments;
CREATE POLICY "Allow all chat attachment operations" ON chat_attachments FOR ALL USING (true) WITH CHECK (true);


-- ######################################################################################################
-- SECTION 3: HELPER FUNCTIONS & TRIGGERS
-- ######################################################################################################

-- Function: Update conversation timestamp on any update
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_conversations_timestamp ON chat_conversations;
CREATE TRIGGER update_chat_conversations_timestamp
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_timestamp();


-- Function: Update conversation's updated_at when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_new_message ON chat_messages;
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();


-- Function: Get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(conv_id UUID, user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM chat_messages
    WHERE conversation_id = conv_id
      AND sender_id != user_id
      AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;


-- ######################################################################################################
-- SECTION 4: ENABLE REALTIME (for instant message delivery)
-- ######################################################################################################

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages';
EXCEPTION WHEN OTHERS THEN
  -- Table may already be in the publication, ignore error
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;


-- ========================================================================================================
-- DONE! Chat feature tables are ready.
-- 
-- Tables created:
--   1. chat_conversations  - Links chat to appointment/patient/doctor
--   2. chat_messages       - Stores encrypted messages with read status
--   3. chat_attachments    - Stores file attachment metadata
--
-- No existing tables were modified.
-- ========================================================================================================

-- ============================================================================
-- SOURCE: notifications-schema.sql
-- ============================================================================
-- Notifications Table Schema
-- Stores in-app notifications for all user roles

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Recipient info
  recipient_id TEXT NOT NULL,           -- User's role-specific ID (P001, D001, N001, S001, admin)
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('patient', 'doctor', 'nurse', 'staff', 'admin')),
  
  -- Notification content
  title TEXT NOT NULL,  
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'appointment_booked',
    'appointment_cancelled',
    'appointment_reminder',
    'appointment_updated',
    'access_granted',
    'access_revoked',
    'report_uploaded',
    'prescription_created',
    'system',
    'general'
  )),
  
  -- Related entity (optional)
  related_entity_type TEXT,             -- 'appointment', 'prescription', 'report', etc.
  related_entity_id TEXT,               -- ID of the related entity
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',          -- Additional data (sender info, action URL, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                -- Optional expiry for time-sensitive notifications
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
  ON notifications(recipient_id, recipient_role);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(recipient_id, recipient_role, is_read) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created 
  ON notifications(created_at DESC);

-- Function to auto-mark old notifications as read after 30 days
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE is_read = FALSE 
    AND created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see their own notifications)
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (true);  -- Will be filtered by recipient_id in queries

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO anon;

-- ============================================================================
-- SOURCE: security-monitoring-schema.sql
-- ============================================================================
-- ==========================================
-- SECURITY MONITORING & BREACH HANDLING SYSTEM
-- EPIC 5: Audit, Monitoring & Breach Handling
-- User Stories: 10577, 10578, 10580, 10583, 10585
-- ==========================================

-- ==========================================
-- 1. SECURITY INCIDENTS TABLE (#10578)
-- Dedicated log for security events
-- ==========================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'unusual_access_pattern',
    'brute_force_attempt',
    'unauthorized_access',
    'data_exfiltration_risk',
    'off_hours_access',
    'excessive_record_access',
    'rapid_fire_actions',
    'account_compromise',
    'policy_violation',
    'system_breach',
    'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_user_id TEXT,
  affected_user_role TEXT,
  source_ip TEXT,
  user_agent TEXT,
  evidence_snapshot JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for security_incidents
CREATE INDEX idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_detected ON security_incidents(detected_at DESC);
CREATE INDEX idx_security_incidents_user ON security_incidents(affected_user_id);

-- ==========================================
-- 2. SECURITY ALERTS TABLE (#10580)
-- Real-time alert notifications for admins
-- ==========================================
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'anomaly_detected',
    'incident_created',
    'threshold_exceeded',
    'breach_suspected',
    'policy_violation',
    'retention_executed',
    'system_warning'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by TEXT,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for security_alerts
CREATE INDEX idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_dismissed ON security_alerts(is_dismissed);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at DESC);

-- ==========================================
-- 3. AUDIT RETENTION POLICIES TABLE (#10585)
-- Configurable retention rules for audit logs
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL UNIQUE CHECK (log_type IN (
    'access_logs',
    'login_attempts',
    'security_incidents',
    'security_alerts',
    'notifications',
    'appointment_logs',
    'medical_record_logs',
    'prescription_logs',
    'video_call_logs'
  )),
  display_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL CHECK (retention_days >= 30),
  archive_before_delete BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  records_deleted_last_run INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ==========================================
-- 4. ANOMALY DETECTION FUNCTION (#10577)
-- Queries access_logs for unusual patterns
-- ==========================================
CREATE OR REPLACE FUNCTION detect_unusual_access_patterns(
  p_hours_lookback INTEGER DEFAULT 24
) RETURNS TABLE(
  anomaly_type TEXT,
  user_id TEXT,
  user_role TEXT,
  details TEXT,
  event_count BIGINT,
  time_window TEXT
) AS $$
BEGIN
  -- 1. Off-hours access (before 6am or after 10pm local time)
  RETURN QUERY
  SELECT
    'off_hours_access'::TEXT AS anomaly_type,
    COALESCE(p.patient_id, d.doctor_id, n.nurse_id, s.staff_id, al.user_id)::TEXT AS user_id,
    al.user_role,
    ('Access at ' || TO_CHAR(al.timestamp AT TIME ZONE 'UTC', 'HH24:MI')
     || ' by ' || COALESCE(
       p.first_name || ' ' || p.last_name,
       d.first_name || ' ' || d.last_name,
       n.first_name || ' ' || n.last_name,
       s.first_name || ' ' || s.last_name,
       al.user_id
     ))::TEXT AS details,
    COUNT(*)::BIGINT AS event_count,
    'Last ' || p_hours_lookback || ' hours' AS time_window
  FROM access_logs al
  LEFT JOIN patients p ON al.user_id = p.id::TEXT
  LEFT JOIN doctors d ON al.user_id = d.id::TEXT
  LEFT JOIN nurses n ON al.user_id = n.id::TEXT
  LEFT JOIN staff s ON al.user_id = s.id::TEXT
  WHERE al.timestamp > (TIMEZONE('utc', NOW()) - INTERVAL '1 hour' * p_hours_lookback)
    AND (
      EXTRACT(HOUR FROM al.timestamp AT TIME ZONE 'UTC') < 6
      OR EXTRACT(HOUR FROM al.timestamp AT TIME ZONE 'UTC') >= 22
    )
  GROUP BY al.user_id, al.user_role,
           TO_CHAR(al.timestamp AT TIME ZONE 'UTC', 'HH24:MI'),
           p.patient_id, p.first_name, p.last_name,
           d.doctor_id, d.first_name, d.last_name,
           n.nurse_id, n.first_name, n.last_name,
           s.staff_id, s.first_name, s.last_name
  HAVING COUNT(*) >= 3;

  -- 2. Excessive record access (>20 accesses in 1 hour by same user)
  RETURN QUERY
  SELECT
    'excessive_record_access'::TEXT AS anomaly_type,
    COALESCE(p.patient_id, d.doctor_id, n.nurse_id, s.staff_id, al.user_id)::TEXT AS user_id,
    al.user_role,
    (COALESCE(
       p.first_name || ' ' || p.last_name,
       d.first_name || ' ' || d.last_name,
       n.first_name || ' ' || n.last_name,
       s.first_name || ' ' || s.last_name,
       al.user_id
     ) || ' accessed ' || COUNT(*) || ' records in 1 hour')::TEXT AS details,
    COUNT(*)::BIGINT AS event_count,
    'Hourly window' AS time_window
  FROM access_logs al
  LEFT JOIN patients p ON al.user_id = p.id::TEXT
  LEFT JOIN doctors d ON al.user_id = d.id::TEXT
  LEFT JOIN nurses n ON al.user_id = n.id::TEXT
  LEFT JOIN staff s ON al.user_id = s.id::TEXT
  WHERE al.timestamp > (TIMEZONE('utc', NOW()) - INTERVAL '1 hour' * p_hours_lookback)
    AND al.resource_type IN ('medical_record', 'prescription', 'patient_data')
  GROUP BY al.user_id, al.user_role, DATE_TRUNC('hour', al.timestamp),
           p.patient_id, p.first_name, p.last_name,
           d.doctor_id, d.first_name, d.last_name,
           n.nurse_id, n.first_name, n.last_name,
           s.staff_id, s.first_name, s.last_name
  HAVING COUNT(*) > 20;

  -- 3. Rapid-fire actions (>10 actions within 2-minute windows)
  RETURN QUERY
  SELECT
    'rapid_fire_actions'::TEXT AS anomaly_type,
    COALESCE(p.patient_id, d.doctor_id, n.nurse_id, s.staff_id, al.user_id)::TEXT AS user_id,
    al.user_role,
    (COALESCE(
       p.first_name || ' ' || p.last_name,
       d.first_name || ' ' || d.last_name,
       n.first_name || ' ' || n.last_name,
       s.first_name || ' ' || s.last_name,
       al.user_id
     ) || ' performed ' || COUNT(*) || ' actions in 2 minutes')::TEXT AS details,
    COUNT(*)::BIGINT AS event_count,
    '2-minute window' AS time_window
  FROM access_logs al
  LEFT JOIN patients p ON al.user_id = p.id::TEXT
  LEFT JOIN doctors d ON al.user_id = d.id::TEXT
  LEFT JOIN nurses n ON al.user_id = n.id::TEXT
  LEFT JOIN staff s ON al.user_id = s.id::TEXT
  WHERE al.timestamp > (TIMEZONE('utc', NOW()) - INTERVAL '1 hour' * p_hours_lookback)
  GROUP BY al.user_id, al.user_role, DATE_TRUNC('minute', al.timestamp),
           p.patient_id, p.first_name, p.last_name,
           d.doctor_id, d.first_name, d.last_name,
           n.nurse_id, n.first_name, n.last_name,
           s.staff_id, s.first_name, s.last_name
  HAVING COUNT(*) > 10;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. RETENTION POLICY EXECUTION FUNCTION (#10585)
-- Deletes logs older than the configured retention period
-- ==========================================
CREATE OR REPLACE FUNCTION apply_retention_policies()
RETURNS TABLE(
  log_type TEXT,
  records_deleted BIGINT
) AS $$
DECLARE
  policy RECORD;
  v_deleted BIGINT;
  v_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR policy IN
    SELECT * FROM audit_retention_policies WHERE is_active = true
  LOOP
    v_cutoff := TIMEZONE('utc', NOW()) - (INTERVAL '1 day' * policy.retention_days);
    v_deleted := 0;

    CASE policy.log_type
      WHEN 'access_logs' THEN
        DELETE FROM access_logs WHERE timestamp < v_cutoff;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'login_attempts' THEN
        DELETE FROM login_attempts WHERE attempted_at < v_cutoff;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'security_incidents' THEN
        DELETE FROM security_incidents WHERE created_at < v_cutoff AND status IN ('resolved', 'dismissed');
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'security_alerts' THEN
        DELETE FROM security_alerts WHERE created_at < v_cutoff AND is_dismissed = true;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'notifications' THEN
        DELETE FROM notifications WHERE created_at < v_cutoff AND is_read = true;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      ELSE
        v_deleted := 0;
    END CASE;

    -- Update the policy record
    UPDATE audit_retention_policies
    SET last_executed_at = TIMEZONE('utc', NOW()),
        records_deleted_last_run = v_deleted,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = policy.id;

    log_type := policy.log_type;
    records_deleted := v_deleted;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. DEFAULT RETENTION POLICIES
-- ==========================================
INSERT INTO audit_retention_policies (log_type, display_name, retention_days, archive_before_delete, is_active)
VALUES
  ('access_logs', 'System Access Logs', 365, true, true),
  ('login_attempts', 'Login Attempt Records', 90, true, true),
  ('security_incidents', 'Security Incidents', 730, true, true),
  ('security_alerts', 'Security Alerts', 180, false, true),
  ('notifications', 'User Notifications', 60, false, true)
ON CONFLICT (log_type) DO NOTHING;

-- ==========================================
-- 7. ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- Security incidents: admin-only read, system insert
CREATE POLICY "Admin read security incidents" ON security_incidents FOR SELECT USING (true);
CREATE POLICY "System insert security incidents" ON security_incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update security incidents" ON security_incidents FOR UPDATE USING (true);

-- Security alerts: admin-only read, system insert
CREATE POLICY "Admin read security alerts" ON security_alerts FOR SELECT USING (true);
CREATE POLICY "System insert security alerts" ON security_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update security alerts" ON security_alerts FOR UPDATE USING (true);

-- Retention policies: admin-only
CREATE POLICY "Admin manage retention policies" ON audit_retention_policies FOR ALL USING (true);

-- ==========================================
-- 8. COMMENTS
-- ==========================================
COMMENT ON TABLE security_incidents IS 'Logs security events with severity levels for incident response (Story #10578)';
COMMENT ON TABLE security_alerts IS 'Real-time alerts for admins on suspicious activities (Story #10580)';
COMMENT ON TABLE audit_retention_policies IS 'Configurable retention periods for audit log cleanup (Story #10585)';
COMMENT ON FUNCTION detect_unusual_access_patterns IS 'Scans access_logs for anomalous patterns (Story #10577)';
COMMENT ON FUNCTION apply_retention_policies IS 'Enforces data retention by deleting old records (Story #10585)';

-- ============================================================================
-- SOURCE: vitals-schema.sql
-- ============================================================================
-- ============================================
-- PATIENT VITALS TRACKING SYSTEM
-- ============================================
-- This schema creates a comprehensive vitals tracking system
-- where patients can update their health metrics and doctors can view them

-- Create patient_vitals table
CREATE TABLE IF NOT EXISTS patient_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Vitals
  height_cm DECIMAL(5,2), -- Height in centimeters
  weight_kg DECIMAL(5,2), -- Weight in kilograms
  bmi DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE 
      WHEN height_cm > 0 THEN weight_kg / ((height_cm / 100) * (height_cm / 100))
      ELSE NULL
    END
  ) STORED,
  
  -- Cardiovascular
  blood_pressure_systolic INTEGER, -- mmHg
  blood_pressure_diastolic INTEGER, -- mmHg
  heart_rate INTEGER, -- beats per minute
  
  -- Respiratory
  respiratory_rate INTEGER, -- breaths per minute
  oxygen_saturation DECIMAL(4,2), -- SpO2 percentage
  
  -- Metabolic
  blood_sugar DECIMAL(5,2), -- mg/dL
  blood_sugar_type TEXT CHECK (blood_sugar_type IN ('fasting', 'random', 'post_meal', 'hba1c')),
  temperature_celsius DECIMAL(4,2), -- Body temperature
  
  -- Additional Health Metrics
  cholesterol_total DECIMAL(5,2), -- mg/dL
  cholesterol_ldl DECIMAL(5,2), -- LDL (bad cholesterol)
  cholesterol_hdl DECIMAL(5,2), -- HDL (good cholesterol)
  triglycerides DECIMAL(5,2), -- mg/dL
  
  -- Lifestyle & Wellness
  sleep_hours DECIMAL(3,1), -- Hours of sleep
  water_intake_ml INTEGER, -- Daily water intake
  exercise_minutes INTEGER, -- Daily exercise duration
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10), -- 1-10 scale
  
  -- Notes
  notes TEXT,
  symptoms TEXT,
  
  -- Metadata
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  recorded_by TEXT, -- 'patient' or 'nurse' or 'doctor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add health_profile and is_profile_completed columns to patients table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'health_profile'
  ) THEN
    ALTER TABLE patients ADD COLUMN health_profile JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'is_profile_completed'
  ) THEN
    ALTER TABLE patients ADD COLUMN is_profile_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create vitals_alerts table for tracking abnormal readings
CREATE TABLE IF NOT EXISTS vitals_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vital_id UUID REFERENCES patient_vitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL, -- 'high_bp', 'low_oxygen', 'high_sugar', etc.
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID, -- doctor or nurse who acknowledged
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_at ON patient_vitals(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_alerts_patient_id ON vitals_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_alerts_acknowledged ON vitals_alerts(is_acknowledged);

-- Create function to automatically generate alerts for abnormal vitals
CREATE OR REPLACE FUNCTION check_vital_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  -- High Blood Pressure (Hypertension)
  IF NEW.blood_pressure_systolic >= 140 OR NEW.blood_pressure_diastolic >= 90 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'high_blood_pressure',
      CASE 
        WHEN NEW.blood_pressure_systolic >= 180 OR NEW.blood_pressure_diastolic >= 120 THEN 'critical'
        WHEN NEW.blood_pressure_systolic >= 160 OR NEW.blood_pressure_diastolic >= 100 THEN 'high'
        ELSE 'medium'
      END,
      'Blood pressure reading: ' || NEW.blood_pressure_systolic || '/' || NEW.blood_pressure_diastolic || ' mmHg'
    );
  END IF;
  
  -- Low Blood Pressure (Hypotension)
  IF NEW.blood_pressure_systolic < 90 OR NEW.blood_pressure_diastolic < 60 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'low_blood_pressure',
      'medium',
      'Blood pressure reading: ' || NEW.blood_pressure_systolic || '/' || NEW.blood_pressure_diastolic || ' mmHg'
    );
  END IF;
  
  -- Low Oxygen Saturation
  IF NEW.oxygen_saturation IS NOT NULL AND NEW.oxygen_saturation < 95 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'low_oxygen',
      CASE 
        WHEN NEW.oxygen_saturation < 90 THEN 'critical'
        WHEN NEW.oxygen_saturation < 92 THEN 'high'
        ELSE 'medium'
      END,
      'Oxygen saturation: ' || NEW.oxygen_saturation || '%'
    );
  END IF;
  
  -- High Blood Sugar
  IF NEW.blood_sugar IS NOT NULL AND NEW.blood_sugar_type = 'fasting' AND NEW.blood_sugar >= 126 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'high_blood_sugar',
      CASE 
        WHEN NEW.blood_sugar >= 200 THEN 'high'
        ELSE 'medium'
      END,
      'Fasting blood sugar: ' || NEW.blood_sugar || ' mg/dL'
    );
  END IF;
  
  -- High Heart Rate (Tachycardia)
  IF NEW.heart_rate IS NOT NULL AND NEW.heart_rate > 100 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'high_heart_rate',
      CASE 
        WHEN NEW.heart_rate > 120 THEN 'high'
        ELSE 'medium'
      END,
      'Heart rate: ' || NEW.heart_rate || ' bpm'
    );
  END IF;
  
  -- Low Heart Rate (Bradycardia)
  IF NEW.heart_rate IS NOT NULL AND NEW.heart_rate < 60 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'low_heart_rate',
      CASE 
        WHEN NEW.heart_rate < 40 THEN 'high'
        ELSE 'medium'
      END,
      'Heart rate: ' || NEW.heart_rate || ' bpm'
    );
  END IF;
  
  -- High Temperature (Fever)
  IF NEW.temperature_celsius IS NOT NULL AND NEW.temperature_celsius >= 38.0 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'fever',
      CASE 
        WHEN NEW.temperature_celsius >= 39.5 THEN 'high'
        ELSE 'medium'
      END,
      'Body temperature: ' || NEW.temperature_celsius || '°C'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check vitals thresholds
DROP TRIGGER IF EXISTS trigger_check_vital_thresholds ON patient_vitals;
CREATE TRIGGER trigger_check_vital_thresholds
  AFTER INSERT ON patient_vitals
  FOR EACH ROW
  EXECUTE FUNCTION check_vital_thresholds();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient_vitals updated_at
DROP TRIGGER IF EXISTS trigger_update_patient_vitals_timestamp ON patient_vitals;
CREATE TRIGGER trigger_update_patient_vitals_timestamp
  BEFORE UPDATE ON patient_vitals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your RLS policies)
-- For now, we'll allow authenticated users to access their own vitals
ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals_alerts ENABLE ROW LEVEL SECURITY;

-- Patients can view and insert their own vitals
CREATE POLICY "Patients can view own vitals" ON patient_vitals
  FOR SELECT USING (true);

CREATE POLICY "Patients can insert own vitals" ON patient_vitals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Patients can update own vitals" ON patient_vitals
  FOR UPDATE USING (true);

-- Doctors and nurses can view all vitals
CREATE POLICY "Medical staff can view all vitals" ON patient_vitals
  FOR SELECT USING (true);

-- Vitals alerts policies
CREATE POLICY "Users can view relevant alerts" ON vitals_alerts
  FOR SELECT USING (true);

CREATE POLICY "Medical staff can acknowledge alerts" ON vitals_alerts
  FOR UPDATE USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Patient Vitals System created successfully!';
  RAISE NOTICE '📊 Tables created: patient_vitals, vitals_alerts';
  RAISE NOTICE '🔔 Automatic alerts configured for abnormal readings';
  RAISE NOTICE '🔒 Row Level Security policies enabled';
END $$;

-- ============================================================================
-- SOURCE: migrations/add_share_health_profile.sql
-- ============================================================================
-- Migration: Add share_health_profile column to appointments table
-- Date: 2026-02-10
-- Description: Allows patients to share their health profile with doctors during appointments

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'share_health_profile'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN share_health_profile BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Column share_health_profile added to appointments table';
  ELSE
    RAISE NOTICE 'Column share_health_profile already exists';
  END IF;
END $$;

-- Add a comment for documentation
COMMENT ON COLUMN appointments.share_health_profile IS 'Indicates if patient has shared their health profile with the doctor for this appointment';

-- ============================================================================
-- SOURCE: migrations/add_zoom_fields.sql
-- ============================================================================
-- ==========================================
-- ZOOM INTEGRATION MIGRATION
-- Add Zoom meeting fields to appointments table
-- ==========================================

-- Add Zoom-specific fields
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_host_url TEXT; -- For doctor
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_join_url TEXT; -- For patient
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_password TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_created_at TIMESTAMP WITH TIME ZONE;

-- Create index for Zoom meeting lookups
CREATE INDEX IF NOT EXISTS idx_appointments_zoom_meeting ON appointments(zoom_meeting_id);

-- Add comment
COMMENT ON COLUMN appointments.zoom_meeting_id IS 'Zoom meeting ID for telemedicine appointments';
COMMENT ON COLUMN appointments.zoom_host_url IS 'Zoom host URL (for doctor to start meeting)';
COMMENT ON COLUMN appointments.zoom_join_url IS 'Zoom join URL (for patient to join meeting)';
COMMENT ON COLUMN appointments.zoom_password IS 'Zoom meeting password';

-- Update existing video_call_link to use zoom_join_url
UPDATE appointments 
SET zoom_join_url = video_call_link 
WHERE video_call_link IS NOT NULL AND zoom_join_url IS NULL;

-- ============================================================================
-- SOURCE: migrations/add_access_expires_at.sql
-- ============================================================================
-- Add access_expires_at column to appointments table
-- This allows patients to set a time-limited access period for health data sharing

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN appointments.access_expires_at IS 
'Optional expiry timestamp for health profile access. If set and the time has passed, access is automatically revoked.';

-- ============================================================================
-- SOURCE: migrations/add_password_reset_fields.sql
-- ============================================================================
-- ============================================================================
-- ADD PASSWORD RESET FIELDS TO PER-ROLE USER TABLES
-- Adds reset_token and reset_token_expiry columns for password reset functionality
-- ============================================================================
-- This app has no unified `users` table -- accounts live in patients/doctors/
-- nurses/staff. app/api/auth/forgot-password/route.ts and
-- app/api/auth/reset-password/route.ts read/write reset_token and
-- reset_token_expiry on those four tables directly.
-- ============================================================================

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

ALTER TABLE nurses
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster token lookups
CREATE INDEX IF NOT EXISTS idx_patients_reset_token ON patients(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctors_reset_token ON doctors(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nurses_reset_token ON nurses(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_reset_token ON staff(reset_token) WHERE reset_token IS NOT NULL;

-- Add comments
COMMENT ON COLUMN patients.reset_token IS 'Hashed token for password reset (SHA-256)';
COMMENT ON COLUMN patients.reset_token_expiry IS 'Expiry timestamp for reset token (1 hour from creation)';
COMMENT ON COLUMN doctors.reset_token IS 'Hashed token for password reset (SHA-256)';
COMMENT ON COLUMN doctors.reset_token_expiry IS 'Expiry timestamp for reset token (1 hour from creation)';
COMMENT ON COLUMN nurses.reset_token IS 'Hashed token for password reset (SHA-256)';
COMMENT ON COLUMN nurses.reset_token_expiry IS 'Expiry timestamp for reset token (1 hour from creation)';
COMMENT ON COLUMN staff.reset_token IS 'Hashed token for password reset (SHA-256)';
COMMENT ON COLUMN staff.reset_token_expiry IS 'Expiry timestamp for reset token (1 hour from creation)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Password reset fields added to patients/doctors/nurses/staff tables';
    RAISE NOTICE '✅ Indexes created for reset_token';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Password reset system is ready!';
END $$;

