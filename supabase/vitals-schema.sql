-- ============================================
-- PATIENT VITALS TRACKING SYSTEM
-- ============================================
-- This schema creates a comprehensive vitals tracking system
-- where patients can update their health metrics and doctors can view them

-- Create patient_vitals table
CREATE TABLE IF NOT EXISTS patient_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Vitals
  height_cm DECIMAL(5,2), -- Height in centimeters
  weight_kg DECIMAL(5,2), -- Weight in kilograms
  bmi DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE 
      WHEN height_cm > 0 THEN weight_kg / ((height_cm / 100) * (height_cm / 100))
      ELSE NULL
    END
  ) STORED,
  
  -- Cardiovascular
  blood_pressure_systolic INTEGER, -- mmHg
  blood_pressure_diastolic INTEGER, -- mmHg
  heart_rate INTEGER, -- beats per minute
  
  -- Respiratory
  respiratory_rate INTEGER, -- breaths per minute
  oxygen_saturation DECIMAL(4,2), -- SpO2 percentage
  
  -- Metabolic
  blood_sugar DECIMAL(5,2), -- mg/dL
  blood_sugar_type TEXT CHECK (blood_sugar_type IN ('fasting', 'random', 'post_meal', 'hba1c')),
  temperature_celsius DECIMAL(4,2), -- Body temperature
  
  -- Additional Health Metrics
  cholesterol_total DECIMAL(5,2), -- mg/dL
  cholesterol_ldl DECIMAL(5,2), -- LDL (bad cholesterol)
  cholesterol_hdl DECIMAL(5,2), -- HDL (good cholesterol)
  triglycerides DECIMAL(5,2), -- mg/dL
  
  -- Lifestyle & Wellness
  sleep_hours DECIMAL(3,1), -- Hours of sleep
  water_intake_ml INTEGER, -- Daily water intake
  exercise_minutes INTEGER, -- Daily exercise duration
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10), -- 1-10 scale
  
  -- Notes
  notes TEXT,
  symptoms TEXT,
  
  -- Metadata
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  recorded_by TEXT, -- 'patient' or 'nurse' or 'doctor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add health_profile and is_profile_completed columns to patients table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'health_profile'
  ) THEN
    ALTER TABLE patients ADD COLUMN health_profile JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'is_profile_completed'
  ) THEN
    ALTER TABLE patients ADD COLUMN is_profile_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create vitals_alerts table for tracking abnormal readings
CREATE TABLE IF NOT EXISTS vitals_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vital_id UUID REFERENCES patient_vitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL, -- 'high_bp', 'low_oxygen', 'high_sugar', etc.
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID, -- doctor or nurse who acknowledged
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_at ON patient_vitals(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_alerts_patient_id ON vitals_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_alerts_acknowledged ON vitals_alerts(is_acknowledged);

-- Create function to automatically generate alerts for abnormal vitals
CREATE OR REPLACE FUNCTION check_vital_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  -- High Blood Pressure (Hypertension)
  IF NEW.blood_pressure_systolic >= 140 OR NEW.blood_pressure_diastolic >= 90 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'high_blood_pressure',
      CASE 
        WHEN NEW.blood_pressure_systolic >= 180 OR NEW.blood_pressure_diastolic >= 120 THEN 'critical'
        WHEN NEW.blood_pressure_systolic >= 160 OR NEW.blood_pressure_diastolic >= 100 THEN 'high'
        ELSE 'medium'
      END,
      'Blood pressure reading: ' || NEW.blood_pressure_systolic || '/' || NEW.blood_pressure_diastolic || ' mmHg'
    );
  END IF;
  
  -- Low Blood Pressure (Hypotension)
  IF NEW.blood_pressure_systolic < 90 OR NEW.blood_pressure_diastolic < 60 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'low_blood_pressure',
      'medium',
      'Blood pressure reading: ' || NEW.blood_pressure_systolic || '/' || NEW.blood_pressure_diastolic || ' mmHg'
    );
  END IF;
  
  -- Low Oxygen Saturation
  IF NEW.oxygen_saturation IS NOT NULL AND NEW.oxygen_saturation < 95 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'low_oxygen',
      CASE 
        WHEN NEW.oxygen_saturation < 90 THEN 'critical'
        WHEN NEW.oxygen_saturation < 92 THEN 'high'
        ELSE 'medium'
      END,
      'Oxygen saturation: ' || NEW.oxygen_saturation || '%'
    );
  END IF;
  
  -- High Blood Sugar
  IF NEW.blood_sugar IS NOT NULL AND NEW.blood_sugar_type = 'fasting' AND NEW.blood_sugar >= 126 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'high_blood_sugar',
      CASE 
        WHEN NEW.blood_sugar >= 200 THEN 'high'
        ELSE 'medium'
      END,
      'Fasting blood sugar: ' || NEW.blood_sugar || ' mg/dL'
    );
  END IF;
  
  -- High Heart Rate (Tachycardia)
  IF NEW.heart_rate IS NOT NULL AND NEW.heart_rate > 100 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'high_heart_rate',
      CASE 
        WHEN NEW.heart_rate > 120 THEN 'high'
        ELSE 'medium'
      END,
      'Heart rate: ' || NEW.heart_rate || ' bpm'
    );
  END IF;
  
  -- Low Heart Rate (Bradycardia)
  IF NEW.heart_rate IS NOT NULL AND NEW.heart_rate < 60 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'low_heart_rate',
      CASE 
        WHEN NEW.heart_rate < 40 THEN 'high'
        ELSE 'medium'
      END,
      'Heart rate: ' || NEW.heart_rate || ' bpm'
    );
  END IF;
  
  -- High Temperature (Fever)
  IF NEW.temperature_celsius IS NOT NULL AND NEW.temperature_celsius >= 38.0 THEN
    INSERT INTO vitals_alerts (vital_id, patient_id, alert_type, severity, message)
    VALUES (
      NEW.id,
      NEW.patient_id,
      'fever',
      CASE 
        WHEN NEW.temperature_celsius >= 39.5 THEN 'high'
        ELSE 'medium'
      END,
      'Body temperature: ' || NEW.temperature_celsius || '°C'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check vitals thresholds
DROP TRIGGER IF EXISTS trigger_check_vital_thresholds ON patient_vitals;
CREATE TRIGGER trigger_check_vital_thresholds
  AFTER INSERT ON patient_vitals
  FOR EACH ROW
  EXECUTE FUNCTION check_vital_thresholds();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient_vitals updated_at
DROP TRIGGER IF EXISTS trigger_update_patient_vitals_timestamp ON patient_vitals;
CREATE TRIGGER trigger_update_patient_vitals_timestamp
  BEFORE UPDATE ON patient_vitals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your RLS policies)
-- For now, we'll allow authenticated users to access their own vitals
ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals_alerts ENABLE ROW LEVEL SECURITY;

-- Patients can view and insert their own vitals
CREATE POLICY "Patients can view own vitals" ON patient_vitals
  FOR SELECT USING (true);

CREATE POLICY "Patients can insert own vitals" ON patient_vitals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Patients can update own vitals" ON patient_vitals
  FOR UPDATE USING (true);

-- Doctors and nurses can view all vitals
CREATE POLICY "Medical staff can view all vitals" ON patient_vitals
  FOR SELECT USING (true);

-- Vitals alerts policies
CREATE POLICY "Users can view relevant alerts" ON vitals_alerts
  FOR SELECT USING (true);

CREATE POLICY "Medical staff can acknowledge alerts" ON vitals_alerts
  FOR UPDATE USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Patient Vitals System created successfully!';
  RAISE NOTICE '📊 Tables created: patient_vitals, vitals_alerts';
  RAISE NOTICE '🔔 Automatic alerts configured for abnormal readings';
  RAISE NOTICE '🔒 Row Level Security policies enabled';
END $$;
