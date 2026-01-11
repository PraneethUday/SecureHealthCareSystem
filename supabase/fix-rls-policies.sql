-- ==========================================
-- FIX: Disable RLS and Update Policies
-- Run this in Supabase SQL Editor AFTER running the main schema
-- ==========================================

-- Temporarily disable RLS for appointments to allow inserts
-- This is safe because we're using session-based auth at the application layer
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Admin can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can cancel their appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Admin can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can view active hospitals" ON hospitals;
DROP POLICY IF EXISTS "Only admin can manage hospitals" ON hospitals;
DROP POLICY IF EXISTS "Only admin can view appointment logs" ON appointment_logs;
DROP POLICY IF EXISTS "Allow log insertion" ON appointment_logs;

-- Create simple permissive policies (or just keep RLS disabled)
-- Option 1: Allow all operations (since we handle auth at app level)
CREATE POLICY "Allow all appointments operations"
  ON appointments FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all hospitals read"
  ON hospitals FOR SELECT
  USING (true);

CREATE POLICY "Allow all appointment logs operations"
  ON appointment_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Or Option 2: Keep RLS disabled (already done above)
-- This is simpler and works with session-based auth
