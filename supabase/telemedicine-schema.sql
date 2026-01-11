-- ==========================================
-- TELEMEDICINE & E-PRESCRIPTION SYSTEM
-- Extends the appointment system with video calls and prescriptions
-- ==========================================

-- Add telemedicine support to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_telemedicine BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_call_link TEXT,
ADD COLUMN IF NOT EXISTS video_call_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS video_call_ended_at TIMESTAMP WITH TIME ZONE;

-- Create index for telemedicine appointments
CREATE INDEX IF NOT EXISTS idx_appointments_telemedicine ON appointments(is_telemedicine) WHERE is_telemedicine = true;

-- ==========================================
-- PRESCRIPTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  notes TEXT,
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, discontinued
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescribed_date DESC);

-- ==========================================
-- PRESCRIPTION LOGS TABLE (Audit Trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS prescription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- created, updated, discontinued
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_prescription_logs_prescription ON prescription_logs(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_logs_user ON prescription_logs(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_logs_timestamp ON prescription_logs(timestamp DESC);

-- ==========================================
-- VIDEO CALL LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS video_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  call_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  call_status TEXT, -- completed, interrupted, failed
  quality_rating INTEGER, -- 1-5
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_call_logs_appointment ON video_call_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_patient ON video_call_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_doctor ON video_call_logs(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_date ON video_call_logs(call_started_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_logs ENABLE ROW LEVEL SECURITY;

-- Prescriptions Policies
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
CREATE POLICY "Patients can view their own prescriptions"
  ON prescriptions FOR SELECT
  USING (true); -- We handle auth at app level

DROP POLICY IF EXISTS "Doctors can create prescriptions" ON prescriptions;
CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (true); -- We handle auth at app level

DROP POLICY IF EXISTS "Doctors can update their prescriptions" ON prescriptions;
CREATE POLICY "Doctors can update their prescriptions"
  ON prescriptions FOR UPDATE
  USING (true); -- We handle auth at app level

-- Prescription Logs Policies (Admin only - handled at app level)
DROP POLICY IF EXISTS "Allow prescription log viewing" ON prescription_logs;
CREATE POLICY "Allow prescription log viewing"
  ON prescription_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow prescription log insertion" ON prescription_logs;
CREATE POLICY "Allow prescription log insertion"
  ON prescription_logs FOR INSERT
  WITH CHECK (true);

-- Video Call Logs Policies
DROP POLICY IF EXISTS "Allow video call log viewing" ON video_call_logs;
CREATE POLICY "Allow video call log viewing"
  ON video_call_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow video call log insertion" ON video_call_logs;
CREATE POLICY "Allow video call log insertion"
  ON video_call_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow video call log updates" ON video_call_logs;
CREATE POLICY "Allow video call log updates"
  ON video_call_logs FOR UPDATE
  USING (true);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to calculate duration when call ends
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.call_ended_at IS NOT NULL AND NEW.call_started_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.call_ended_at - NEW.call_started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
DROP TRIGGER IF EXISTS calculate_call_duration_trigger ON video_call_logs;
CREATE TRIGGER calculate_call_duration_trigger
  BEFORE INSERT OR UPDATE ON video_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_call_duration();

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Telemedicine & E-Prescription schema created successfully!' as message;
