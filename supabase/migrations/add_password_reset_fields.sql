-- ============================================================================
-- ADD PASSWORD RESET FIELDS TO USERS TABLE
-- Adds reset_token and reset_token_expiry columns for password reset functionality
-- ============================================================================

-- Add reset token columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token 
ON public.users(reset_token) 
WHERE reset_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.users.reset_token IS 'Hashed token for password reset (SHA-256)';
COMMENT ON COLUMN public.users.reset_token_expiry IS 'Expiry timestamp for reset token (1 hour from creation)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Password reset fields added to users table';
    RAISE NOTICE '✅ Index created for reset_token';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Password reset system is ready!';
END $$;
