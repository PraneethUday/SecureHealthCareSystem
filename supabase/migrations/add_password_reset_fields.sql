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
