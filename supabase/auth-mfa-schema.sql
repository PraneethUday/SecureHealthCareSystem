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
