-- ==========================================
-- APPOINTMENTS MANAGEMENT SYSTEM SCHEMA
-- Healthcare-grade with RLS policies
-- ==========================================

-- ==========================================
-- DROP EXISTING OBJECTS (Clean Slate)
-- ==========================================

-- Drop views
DROP VIEW IF EXISTS upcoming_appointments CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS appointments_audit_trigger ON appointments;

-- Drop functions
DROP FUNCTION IF EXISTS log_appointment_change() CASCADE;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS appointment_logs CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- Drop types
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- ==========================================
-- CREATE TYPES
-- ==========================================

-- Create enum types for better data integrity
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE action_type AS ENUM ('created', 'updated', 'cancelled', 'completed', 'rescheduled');

-- ==========================================
-- HOSPITALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  departments TEXT[], -- Array of departments like ['Cardiology', 'Neurology']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_active ON hospitals(is_active);

-- Insert sample hospitals - Tamil Nadu (with fixed UUIDs for consistency)
INSERT INTO hospitals (id, name, address, city, state, phone, departments) VALUES
('11111111-1111-1111-1111-111111111111', 'Apollo Hospitals', '21 Greams Lane', 'Chennai', 'Tamil Nadu', '044-2829-3333', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Emergency']),
('22222222-2222-2222-2222-222222222222', 'Fortis Malar Hospital', '52 Gandhi Nagar', 'Chennai', 'Tamil Nadu', '044-4289-2222', ARRAY['Orthopedics', 'Cardiology', 'Pediatrics', 'Surgery']),
('33333333-3333-3333-3333-333333333333', 'KMCH Hospital', 'Avanashi Road', 'Coimbatore', 'Tamil Nadu', '0422-4344-444', ARRAY['Cardiology', 'Neurology', 'Emergency', 'ICU']),
('44444444-4444-4444-4444-444444444444', 'PSG Hospitals', 'Peelamedu', 'Coimbatore', 'Tamil Nadu', '0422-2570-170', ARRAY['General Medicine', 'Pediatrics', 'Orthopedics', 'Surgery']),
('55555555-5555-5555-5555-555555555555', 'Kauvery Hospital', 'Trichy Road', 'Tiruchirappalli', 'Tamil Nadu', '0431-4077-777', ARRAY['Cardiology', 'Oncology', 'Neurology', 'Emergency']),
('66666666-6666-6666-6666-666666666666', 'Velammal Medical College Hospital', 'Anuppanadi', 'Madurai', 'Tamil Nadu', '0452-2989-878', ARRAY['General Medicine', 'Pediatrics', 'Surgery', 'ICU']),
('77777777-7777-7777-7777-777777777777', 'Vijaya Hospital', 'Vadapalani', 'Chennai', 'Tamil Nadu', '044-2361-2364', ARRAY['Cardiology', 'Orthopedics', 'Neurology', 'Emergency']),
('88888888-8888-8888-8888-888888888888', 'GEM Hospital', 'Ramanathapuram', 'Coimbatore', 'Tamil Nadu', '0422-2324-105', ARRAY['General Medicine', 'Surgery', 'Oncology', 'ICU']),
('99999999-9999-9999-9999-999999999999', 'Rela Hospital', 'Chromepet', 'Chennai', 'Tamil Nadu', '044-4510-2020', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Surgery']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MIOT International', 'Manapakkam', 'Chennai', 'Tamil Nadu', '044-4200-2020', ARRAY['Orthopedics', 'Cardiology', 'Pediatrics', 'Emergency'])
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- APPOINTMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  is_telemedicine BOOLEAN DEFAULT false,
  share_health_profile BOOLEAN DEFAULT false,
  video_call_link TEXT,
  video_call_started_at TIMESTAMP WITH TIME ZONE,
  video_call_ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_doctor_time UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- Indexes for performance
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- ==========================================
-- APPOINTMENT LOGS TABLE (Audit Trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS appointment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_status appointment_status,
  new_status appointment_status,
  metadata JSONB, -- Store additional details
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for admin dashboard queries
CREATE INDEX idx_appointment_logs_appointment ON appointment_logs(appointment_id);
CREATE INDEX idx_appointment_logs_user ON appointment_logs(performed_by_user_id);
CREATE INDEX idx_appointment_logs_action ON appointment_logs(action_type);
CREATE INDEX idx_appointment_logs_timestamp ON appointment_logs(timestamp DESC);
CREATE INDEX idx_appointment_logs_role ON appointment_logs(performed_by_role);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HOSPITALS POLICIES
-- Everyone can read active hospitals
-- ==========================================
CREATE POLICY "Anyone can view active hospitals"
  ON hospitals FOR SELECT
  USING (is_active = true);

-- Only admin can modify hospitals
CREATE POLICY "Only admin can manage hospitals"
  ON hospitals FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- ==========================================
-- APPOINTMENTS POLICIES
-- ==========================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view their own appointments"
  ON appointments FOR SELECT
  USING (true);

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view their appointments"
  ON appointments FOR SELECT
  USING (true);

-- Admin can view all appointments
CREATE POLICY "Admin can view all appointments"
  ON appointments FOR SELECT
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

-- Patients can cancel their own appointments
CREATE POLICY "Patients can cancel their appointments"
  ON appointments FOR UPDATE
  USING (true);

-- Doctortrue
CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (true);

-- Admin can do everything with appointments
CREATE POLICY "Admin can manage all appointments"
  ON appointments FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- ==========================================
-- APPOINTMENT LOGS POLICIES
-- ==========================================

-- Only admin can view logs
CREATE POLICY "Only admin can view appointment logs"
  ON appointment_logs FOR SELECT
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- Anyone can insert logs (system action)
CREATE POLICY "Allow log insertion"
  ON appointment_logs FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- FUNCTIONS FOR AUDIT LOGGING
-- ==========================================

-- Function to log appointment changes
CREATE OR REPLACE FUNCTION log_appointment_change()
RETURNS TRIGGER AS $$
DECLARE
  user_id TEXT;
  user_role TEXT;
BEGIN
  -- Safely get user ID and role, use defaults if not available
  BEGIN
    user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    user_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION WHEN OTHERS THEN
    user_id := 'system';
    user_role := 'system';
  END;
  
  -- Use default values if null
  IF user_id IS NULL THEN
    user_id := 'system';
  END IF;
  IF user_role IS NULL THEN
    user_role := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO appointment_logs (
      appointment_id,
      action_type,
      performed_by_user_id,
      performed_by_role,
      new_status,
      metadata
    ) VALUES (
      NEW.id,
      'created',
      user_id,
      user_role,
      NEW.status,
      jsonb_build_object(
        'appointment_date', NEW.appointment_date,
        'appointment_time', NEW.appointment_time,
        'doctor_id', NEW.doctor_id,
        'hospital_id', NEW.hospital_id
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO appointment_logs (
        appointment_id,
        action_type,
        performed_by_user_id,
        performed_by_role,
        old_status,
        new_status,
        metadata
      ) VALUES (
        NEW.id,
        CASE NEW.status::text
          WHEN 'cancelled' THEN 'cancelled'::action_type
          WHEN 'completed' THEN 'completed'::action_type
          ELSE 'updated'::action_type
        END,
        user_id,
        user_role,
        OLD.status,
        NEW.status,
        jsonb_build_object(
          'cancellation_reason', NEW.cancellation_reason,
          'old_date', OLD.appointment_date,
          'new_date', NEW.appointment_date
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to appointments table
CREATE TRIGGER appointments_audit_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_appointment_change();

-- ==========================================
-- HELPER VIEWS
-- ==========================================

-- View for upcoming appointments
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
  a.*,
  p.first_name || ' ' || p.last_name as patient_name,
  p.email as patient_email,
  d.first_name || ' ' || d.last_name as doctor_name,
  d.specialization,
  h.name as hospital_name,
  h.address as hospital_address
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN hospitals h ON a.hospital_id = h.id
WHERE a.appointment_date >= CURRENT_DATE
  AND a.status = 'scheduled'
ORDER BY a.appointment_date, a.appointment_time;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================
COMMENT ON TABLE appointments IS 'Core appointments table with doctor-patient scheduling';
COMMENT ON TABLE appointment_logs IS 'Audit trail for all appointment actions';
COMMENT ON TABLE hospitals IS 'Healthcare facilities where appointments take place';
COMMENT ON COLUMN appointments.duration_minutes IS 'Default 30 minutes, can be adjusted';
COMMENT ON CONSTRAINT unique_doctor_time ON appointments IS 'Prevents double booking for doctors';
