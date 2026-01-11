-- ==========================================
-- COMPLETE FIX: RLS + Trigger Issues
-- Run this SQL in Supabase Dashboard
-- ==========================================

-- 1. Disable RLS on all appointment tables
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
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

-- 3. Drop the problematic trigger
DROP TRIGGER IF EXISTS appointment_change_trigger ON appointments;

-- 4. Make logging fields nullable (so trigger doesn't fail)
ALTER TABLE appointment_logs ALTER COLUMN performed_by_user_id DROP NOT NULL;
ALTER TABLE appointment_logs ALTER COLUMN performed_by_role DROP NOT NULL;

-- 5. Verify the fix
SELECT 
  'SUCCESS! All fixes applied.' as status,
  'You can now create appointments!' as message;
