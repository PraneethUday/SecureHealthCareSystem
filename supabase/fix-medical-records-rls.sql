-- ==========================================
-- FIX MEDICAL RECORDS - COMPLETE REBUILD
-- Recreate table with proper structure + RLS
-- ==========================================

-- Drop and recreate medical records tables
DROP TABLE IF EXISTS medical_record_logs CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;

-- Medical Records Table (PROPER STRUCTURE)
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- Chief Complaint & Diagnosis
  chief_complaint TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  
  -- Vital Signs
  blood_pressure VARCHAR(20),
  heart_rate INTEGER,
  temperature DECIMAL(4,2),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  
  -- Clinical Notes
  symptoms TEXT,
  examination_findings TEXT,
  treatment_plan TEXT,
  recommendations TEXT,
  follow_up_instructions TEXT,
  
  -- Lab Results & Tests
  lab_results TEXT,
  test_results TEXT,
  
  -- Allergies & Medical History
  allergies TEXT,
  current_medications TEXT,
  past_medical_history TEXT,
  
  -- Additional Information
  notes TEXT,
  
  -- Metadata
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add foreign key for appointments if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    ALTER TABLE medical_records ADD CONSTRAINT fk_medical_records_appointment 
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date DESC);

-- Medical Records Audit Log
CREATE TABLE medical_record_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_medical_record_logs_record ON medical_record_logs(medical_record_id);
CREATE INDEX idx_medical_record_logs_user ON medical_record_logs(performed_by_user_id);
CREATE INDEX idx_medical_record_logs_timestamp ON medical_record_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all - app handles authorization)
CREATE POLICY "Allow all medical record operations"
  ON medical_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all medical record log operations"
  ON medical_record_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_medical_record_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_record_timestamp_trigger
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_record_timestamp();

SELECT '✅ Medical records system rebuilt successfully!' as message;
