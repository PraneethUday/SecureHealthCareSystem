-- ==========================================
-- NURSE-HOSPITAL & STAFF-HOSPITAL ASSOCIATION SCHEMA
-- Links nurses and staff to specific hospitals
-- (Same pattern as doctor_hospitals)
-- ==========================================

-- ==========================================
-- NURSE-HOSPITAL JUNCTION TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS nurse_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_nurse_hospital UNIQUE (nurse_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_hospitals_nurse ON nurse_hospitals(nurse_id);
CREATE INDEX IF NOT EXISTS idx_nurse_hospitals_hospital ON nurse_hospitals(hospital_id);

ALTER TABLE nurse_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to nurse_hospitals"
  ON nurse_hospitals FOR SELECT
  USING (true);

-- ==========================================
-- STAFF-HOSPITAL JUNCTION TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS staff_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_staff_hospital UNIQUE (staff_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_hospitals_staff ON staff_hospitals(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_hospitals_hospital ON staff_hospitals(hospital_id);

ALTER TABLE staff_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to staff_hospitals"
  ON staff_hospitals FOR SELECT
  USING (true);

-- ==========================================
-- UPDATE AUTO-ASSIGN NURSE TRIGGER
-- Only assign nurses from the SAME hospital
-- ==========================================

CREATE OR REPLACE FUNCTION auto_assign_nurse_to_appointment()
RETURNS TRIGGER AS $$
DECLARE
  assigned_nurse_id UUID;
  doctor_department TEXT;
  appointment_hospital_id UUID;
BEGIN
  -- Get the doctor's department
  SELECT department INTO doctor_department
  FROM doctors
  WHERE id = NEW.doctor_id;

  -- Get the appointment's hospital
  appointment_hospital_id := NEW.hospital_id;

  -- Find an available nurse in the same department AND same hospital
  SELECT n.id INTO assigned_nurse_id
  FROM nurses n
  INNER JOIN nurse_hospitals nh ON nh.nurse_id = n.id
  LEFT JOIN appointments a ON a.nurse_id = n.id 
    AND a.appointment_date = NEW.appointment_date
    AND a.status = 'scheduled'
  WHERE n.department = doctor_department
    AND nh.hospital_id = appointment_hospital_id
  GROUP BY n.id
  ORDER BY COUNT(a.id) ASC, RANDOM()
  LIMIT 1;

  -- If no nurse found in same department + hospital, try same hospital any department
  IF assigned_nurse_id IS NULL THEN
    SELECT n.id INTO assigned_nurse_id
    FROM nurses n
    INNER JOIN nurse_hospitals nh ON nh.nurse_id = n.id
    LEFT JOIN appointments a ON a.nurse_id = n.id 
      AND a.appointment_date = NEW.appointment_date
      AND a.status = 'scheduled'
    WHERE nh.hospital_id = appointment_hospital_id
    GROUP BY n.id
    ORDER BY COUNT(a.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  -- If found, assign the nurse
  IF assigned_nurse_id IS NOT NULL THEN
    NEW.nurse_id := assigned_nurse_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS auto_assign_nurse_trigger ON appointments;
CREATE TRIGGER auto_assign_nurse_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_nurse_to_appointment();
