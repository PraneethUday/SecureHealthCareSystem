-- Add access_expires_at column to appointments table
-- This allows patients to set a time-limited access period for health data sharing

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN appointments.access_expires_at IS 
'Optional expiry timestamp for health profile access. If set and the time has passed, access is automatically revoked.';
