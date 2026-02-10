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
