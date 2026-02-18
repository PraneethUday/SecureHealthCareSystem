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
