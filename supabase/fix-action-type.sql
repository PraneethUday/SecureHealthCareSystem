-- ==========================================
-- FIX ACTION_TYPE COLUMN TYPE ERROR
-- Changes action_type from ENUM to TEXT to fix insert errors
-- ==========================================

-- Change appointment_logs.action_type from ENUM to TEXT
ALTER TABLE appointment_logs 
ALTER COLUMN action_type TYPE TEXT USING action_type::TEXT;

-- Add constraint to ensure valid values (optional, but recommended)
ALTER TABLE appointment_logs 
DROP CONSTRAINT IF EXISTS action_type_check;

ALTER TABLE appointment_logs 
ADD CONSTRAINT action_type_check 
CHECK (action_type IN ('created', 'updated', 'cancelled', 'completed', 'rescheduled'));

-- Success message
SELECT 'action_type column fixed! You can now create/update appointments.' as message;
