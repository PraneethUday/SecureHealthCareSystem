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
