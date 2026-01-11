-- ==========================================
-- MEDICAL RECORDS SYSTEM
-- Electronic Health Records (EHR) for patients
-- ==========================================

-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(record_date DESC);

-- Add foreign key constraint for appointments if table exists
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_medical_records_appointment'
  ) THEN
    ALTER TABLE medical_records DROP CONSTRAINT fk_medical_records_appointment;
  END IF;
  
  -- Add constraint only if appointments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    ALTER TABLE medical_records ADD CONSTRAINT fk_medical_records_appointment 
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Medical Records Audit Log
CREATE TABLE IF NOT EXISTS medical_record_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- created, updated, viewed, downloaded
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_medical_record_logs_record ON medical_record_logs(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_logs_user ON medical_record_logs(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_logs_timestamp ON medical_record_logs(timestamp DESC);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_logs ENABLE ROW LEVEL SECURITY;

-- Medical Records Policies
DROP POLICY IF EXISTS "Patients can view their own medical records" ON medical_records;
CREATE POLICY "Patients can view their own medical records"
  ON medical_records FOR SELECT
  USING (true); -- App handles authorization

DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
CREATE POLICY "Doctors can create medical records"
  ON medical_records FOR INSERT
  WITH CHECK (true); -- App handles authorization

DROP POLICY IF EXISTS "Doctors can update their medical records" ON medical_records;
CREATE POLICY "Doctors can update their medical records"
  ON medical_records FOR UPDATE
  USING (true); -- App handles authorization

-- Medical Record Logs Policies
DROP POLICY IF EXISTS "Allow medical record log viewing" ON medical_record_logs;
CREATE POLICY "Allow medical record log viewing"
  ON medical_record_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow medical record log insertion" ON medical_record_logs;
CREATE POLICY "Allow medical record log insertion"
  ON medical_record_logs FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_medical_record_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_medical_record_timestamp_trigger ON medical_records;
CREATE TRIGGER update_medical_record_timestamp_trigger
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_record_timestamp();

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Medical Records system created successfully!' as message;
