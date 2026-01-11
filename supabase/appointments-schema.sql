-- ==========================================
-- APPOINTMENTS MANAGEMENT SYSTEM SCHEMA
-- Healthcare-grade with RLS policies
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

-- Insert sample hospitals
INSERT INTO hospitals (name, address, city, state, phone, departments) VALUES
('City General Hospital', '123 Healthcare Ave', 'New York', 'NY', '555-1000', ARRAY['Cardiology', 'Neurology', 'Pediatrics', 'Emergency']),
('Memorial Medical Center', '456 Medical Plaza', 'Los Angeles', 'CA', '555-2000', ARRAY['Orthopedics', 'Oncology', 'Cardiology', 'Surgery']),
('Riverside Hospital', '789 River Road', 'Chicago', 'IL', '555-3000', ARRAY['General Medicine', 'Pediatrics', 'ICU', 'Emergency'])
ON CONFLICT DO NOTHING;

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
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND patients.patient_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view their appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = appointments.doctor_id
      AND doctors.doctor_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Admin can view all appointments
CREATE POLICY "Admin can view all appointments"
  ON appointments FOR SELECT
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND patients.patient_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Patients can cancel their own appointments
CREATE POLICY "Patients can cancel their appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = appointments.patient_id
      AND patients.patient_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Doctors can update their appointments
CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = appointments.doctor_id
      AND doctors.doctor_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

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
BEGIN
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
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claims', true)::json->>'role',
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
        CASE NEW.status
          WHEN 'cancelled' THEN 'cancelled'
          WHEN 'completed' THEN 'completed'
          ELSE 'updated'
        END,
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claims', true)::json->>'role',
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
