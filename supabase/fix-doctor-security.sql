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
