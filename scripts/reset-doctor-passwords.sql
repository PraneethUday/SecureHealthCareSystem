-- Reset Doctor Passwords and Clear Login Issues
-- Run this in Supabase SQL Editor

-- Reset passwords, clear password_hash, unlock accounts, and reset login attempts
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

-- Verify the updates
SELECT 
  doctor_id, 
  first_name, 
  last_name, 
  email, 
  specialization, 
  department,
  is_locked,
  login_attempts,
  CASE WHEN password IS NOT NULL THEN 'Set' ELSE 'NULL' END as password_status,
  CASE WHEN password_hash IS NOT NULL THEN 'Set' ELSE 'NULL' END as password_hash_status,
  is_mfa_enabled
FROM doctors 
WHERE doctor_id IN ('D001', 'D002', 'D003')
ORDER BY doctor_id;
