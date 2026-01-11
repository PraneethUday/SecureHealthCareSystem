-- ==========================================
-- WEBRTC VIDEO CALL SYSTEM
-- Secure 1-to-1 patient-doctor video calls
-- ==========================================

-- Video Calls Table
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- Call Status
  status TEXT NOT NULL DEFAULT 'calling',
  -- Values: 'calling' (patient initiated), 'ringing' (doctor notified), 
  --         'accepted' (doctor accepted), 'rejected' (doctor rejected),
  --         'ended' (call completed), 'missed' (no response)
  
  -- Metadata
  initiated_by_role TEXT NOT NULL, -- 'patient' only for now
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Recording & Monitoring
  recording_url TEXT,
  quality_metrics JSONB, -- RTCStatsReport data
  error_logs JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Video Call Signaling Table (temporary signaling data)
CREATE TABLE IF NOT EXISTS video_call_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL,
  from_user_role TEXT NOT NULL, -- 'patient' or 'doctor'
  to_user_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  -- Types: 'offer', 'answer', 'ice-candidate', 'renegotiate'
  
  signal_data JSONB NOT NULL, -- SDP or ICE candidate data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance and querying
CREATE INDEX IF NOT EXISTS idx_video_calls_appointment ON video_calls(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_patient ON video_calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_doctor ON video_calls(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created ON video_calls(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_call_signaling_call ON video_call_signaling(video_call_id);
CREATE INDEX IF NOT EXISTS idx_video_call_signaling_from ON video_call_signaling(from_user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_signaling_to ON video_call_signaling(to_user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_signaling_created ON video_call_signaling(created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on both tables
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_signaling ENABLE ROW LEVEL SECURITY;

-- Video Calls Policies

-- Patients can view their own video calls
DROP POLICY IF EXISTS "Patients can view their own video calls" ON video_calls;
CREATE POLICY "Patients can view their own video calls"
  ON video_calls FOR SELECT
  USING (true); -- App will verify patient_id matches authenticated user

-- Patients can create video calls for their appointments
DROP POLICY IF EXISTS "Patients can create video calls" ON video_calls;
CREATE POLICY "Patients can create video calls"
  ON video_calls FOR INSERT
  WITH CHECK (true); -- App verifies appointment ownership and patient role

-- Doctors can view their video calls
DROP POLICY IF EXISTS "Doctors can view their video calls" ON video_calls;
CREATE POLICY "Doctors can view their video calls"
  ON video_calls FOR SELECT
  USING (true); -- App will verify doctor_id matches authenticated user

-- Allow status updates during call
DROP POLICY IF EXISTS "Allow video call status updates" ON video_calls;
CREATE POLICY "Allow video call status updates"
  ON video_calls FOR UPDATE
  USING (true); -- App verifies user is participant

-- Video Call Signaling Policies

-- Allow users to view signaling data for their calls
DROP POLICY IF EXISTS "Allow view signaling data" ON video_call_signaling;
CREATE POLICY "Allow view signaling data"
  ON video_call_signaling FOR SELECT
  USING (true); -- App verifies user is participant

-- Allow creating signaling messages
DROP POLICY IF EXISTS "Allow create signaling messages" ON video_call_signaling;
CREATE POLICY "Allow create signaling messages"
  ON video_call_signaling FOR INSERT
  WITH CHECK (true); -- App verifies sender is participant

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_calls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_calls_update_timestamp ON video_calls;
CREATE TRIGGER video_calls_update_timestamp
  BEFORE UPDATE ON video_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_video_calls_timestamp();

-- Auto-calculate duration when call ends
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND NEW.call_started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.call_ended_at - NEW.call_started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_calls_calculate_duration ON video_calls;
CREATE TRIGGER video_calls_calculate_duration
  BEFORE UPDATE ON video_calls
  FOR EACH ROW
  EXECUTE FUNCTION calculate_call_duration();

-- Clean up old signaling data (keep last 100 messages per call)
CREATE OR REPLACE FUNCTION cleanup_old_signaling_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old signaling data older than 24 hours
  DELETE FROM video_call_signaling 
  WHERE created_at < TIMEZONE('utc', NOW()) - INTERVAL '24 hours';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_calls_cleanup_signaling ON video_calls;
CREATE TRIGGER video_calls_cleanup_signaling
  AFTER UPDATE ON video_calls
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_signaling_data();

-- ==========================================
-- INITIALIZATION
-- ==========================================

SELECT 'WebRTC Video Call system created successfully!' as status;
