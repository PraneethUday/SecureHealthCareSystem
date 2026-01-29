-- ==========================================
-- ADD NURSE ASSIGNMENT TO APPOINTMENTS
-- ==========================================

-- Add nurse_id column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS nurse_id UUID REFERENCES nurses(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_nurse ON appointments(nurse_id);

-- ==========================================
-- FUNCTION TO AUTO-ASSIGN NURSE
-- Assigns a nurse from the same hospital/department
-- ==========================================

CREATE OR REPLACE FUNCTION auto_assign_nurse_to_appointment()
RETURNS TRIGGER AS $$
DECLARE
  assigned_nurse_id UUID;
  doctor_department TEXT;
BEGIN
  -- Get the doctor's department
  SELECT department INTO doctor_department
  FROM doctors
  WHERE id = NEW.doctor_id;

  -- Find an available nurse in the same department
  -- Prioritize nurses with fewer current assignments
  SELECT n.id INTO assigned_nurse_id
  FROM nurses n
  LEFT JOIN appointments a ON a.nurse_id = n.id 
    AND a.appointment_date = NEW.appointment_date
    AND a.status = 'scheduled'
  WHERE n.department = doctor_department
  GROUP BY n.id
  ORDER BY COUNT(a.id) ASC, RANDOM()
  LIMIT 1;

  -- If found, assign the nurse
  IF assigned_nurse_id IS NOT NULL THEN
    NEW.nurse_id := assigned_nurse_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGER TO AUTO-ASSIGN NURSE
-- ==========================================

DROP TRIGGER IF EXISTS auto_assign_nurse_trigger ON appointments;
CREATE TRIGGER auto_assign_nurse_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_nurse_to_appointment();

-- ==========================================
-- UPDATE RLS POLICIES FOR NURSES
-- ==========================================

-- Nurses can view their assigned appointments
DROP POLICY IF EXISTS "Nurses can view their assigned appointments" ON appointments;
CREATE POLICY "Nurses can view their assigned appointments"
  ON appointments FOR SELECT
  USING (
    nurse_id IN (
      SELECT id FROM nurses WHERE nurse_id = current_setting('request.jwt.claims', true)::json->>'user_id'
    )
  );

-- Nurses can update their assigned appointments (e.g., add notes)
DROP POLICY IF EXISTS "Nurses can update their assigned appointments" ON appointments;
CREATE POLICY "Nurses can update their assigned appointments"
  ON appointments FOR UPDATE
  USING (
    nurse_id IN (
      SELECT id FROM nurses WHERE nurse_id = current_setting('request.jwt.claims', true)::json->>'user_id'
    )
  );

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Nurse assignment added to appointments!' as message;
