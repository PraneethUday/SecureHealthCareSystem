-- ==========================================
-- DOCTOR-HOSPITAL ASSOCIATION SCHEMA
-- Links doctors to specific hospitals
-- ==========================================

-- Drop existing table if exists
DROP TABLE IF EXISTS doctor_hospitals CASCADE;

-- Create doctor_hospitals junction table
CREATE TABLE IF NOT EXISTS doctor_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,  -- Is this the doctor's primary hospital?
  consultation_fee DECIMAL(10, 2),    -- Fee at this hospital
  available_days TEXT[],              -- ['Monday', 'Tuesday', etc.]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_doctor_hospital UNIQUE (doctor_id, hospital_id)
);

-- Create indexes
CREATE INDEX idx_doctor_hospitals_doctor ON doctor_hospitals(doctor_id);
CREATE INDEX idx_doctor_hospitals_hospital ON doctor_hospitals(hospital_id);

-- Enable RLS
ALTER TABLE doctor_hospitals ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for appointment booking)
CREATE POLICY "Allow read access to doctor_hospitals"
  ON doctor_hospitals FOR SELECT
  USING (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read doctor_hospitals"
  ON doctor_hospitals FOR SELECT
  TO authenticated
  USING (true);

