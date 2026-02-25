-- ==========================================
-- FIX: Medical Report Logs Foreign Key Issue
-- ==========================================
-- This fixes the error where deleting a medical report fails because
-- the trigger tries to insert a log entry after the report is deleted,
-- but the foreign key constraint prevents it.

-- Solution: Remove the foreign key constraint so logs persist after deletion

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE medical_report_logs DROP CONSTRAINT IF EXISTS medical_report_logs_report_id_fkey;

-- Step 2: Add a comment explaining why there's no FK constraint
COMMENT ON COLUMN medical_report_logs.report_id IS 'UUID of the report (no FK constraint to preserve delete logs)';

-- Step 3: Recreate the trigger to use BEFORE DELETE for better reliability
CREATE OR REPLACE FUNCTION log_medical_report_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO medical_report_logs (
      report_id,
      action_type,
      performed_by_user_id,
      performed_by_role,
      metadata
    ) VALUES (
      NEW.id,
      'uploaded',
      NEW.uploaded_by_user_id,
      NEW.uploaded_by_role,
      jsonb_build_object(
        'report_name', NEW.report_name,
        'report_type', NEW.report_type,
        'file_size', NEW.file_size
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO medical_report_logs (
      report_id,
      action_type,
      performed_by_user_id,
      performed_by_role,
      metadata
    ) VALUES (
      OLD.id,
      'deleted',
      OLD.uploaded_by_user_id,
      OLD.uploaded_by_role,
      jsonb_build_object(
        'report_name', OLD.report_name,
        'report_type', OLD.report_type
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate trigger with proper timing
DROP TRIGGER IF EXISTS log_medical_report_action_trigger ON medical_reports;
CREATE TRIGGER log_medical_report_action_trigger
  BEFORE INSERT OR DELETE ON medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION log_medical_report_action();

-- Verification
SELECT 'Medical report logs FK constraint fix applied successfully!' as message;
