-- ==========================================
-- MEDICAL REPORTS UPLOAD SYSTEM
-- Allows nurses to upload medical reports/documents for patients
-- Doctors can view and download these reports
-- ==========================================

-- Note: Storage bucket must be created via Supabase Dashboard
-- Go to Storage > Create bucket > Name: "medical-reports" > Public: false

-- ==========================================
-- MEDICAL REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT NOT NULL,
  uploaded_by_role TEXT NOT NULL CHECK (uploaded_by_role IN ('nurse', 'doctor', 'staff')),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'blood_test', 'scan', 'xray', 'mri', 'ct_scan', 'ultrasound',
    'ecg', 'pathology', 'lab_report', 'radiology', 'other'
  )),
  report_name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  notes TEXT,
  metadata JSONB,
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800) -- Max 50MB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_uploader ON medical_reports(uploaded_by_user_id, uploaded_by_role);
CREATE INDEX IF NOT EXISTS idx_medical_reports_type ON medical_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_medical_reports_date ON medical_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_reports_uploaded_at ON medical_reports(uploaded_at DESC);

-- ==========================================
-- MEDICAL REPORT LOGS TABLE (Audit Trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS medical_report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES medical_reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('uploaded', 'viewed', 'downloaded', 'deleted')),
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_report_logs_report ON medical_report_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_medical_report_logs_user ON medical_report_logs(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_medical_report_logs_timestamp ON medical_report_logs(timestamp DESC);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_report_logs ENABLE ROW LEVEL SECURITY;

-- Medical Reports Policies
DROP POLICY IF EXISTS "Allow reading medical reports" ON medical_reports;
CREATE POLICY "Allow reading medical reports"
  ON medical_reports FOR SELECT
  USING (true); -- Auth handled at app level

DROP POLICY IF EXISTS "Allow uploading medical reports" ON medical_reports;
CREATE POLICY "Allow uploading medical reports"
  ON medical_reports FOR INSERT
  WITH CHECK (true); -- Auth handled at app level

DROP POLICY IF EXISTS "Allow deleting medical reports" ON medical_reports;
CREATE POLICY "Allow deleting medical reports"
  ON medical_reports FOR DELETE
  USING (true); -- Auth handled at app level

-- Medical Report Logs Policies
DROP POLICY IF EXISTS "Allow reading report logs" ON medical_report_logs;
CREATE POLICY "Allow reading report logs"
  ON medical_report_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow inserting report logs" ON medical_report_logs;
CREATE POLICY "Allow inserting report logs"
  ON medical_report_logs FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Note: Run these after creating the 'medical-reports' bucket in Supabase Dashboard

-- Allow authenticated uploads
DROP POLICY IF EXISTS "Allow authenticated uploads to medical-reports" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to medical-reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-reports');

-- Allow authenticated reads
DROP POLICY IF EXISTS "Allow authenticated reads from medical-reports" ON storage.objects;
CREATE POLICY "Allow authenticated reads from medical-reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-reports');

-- Allow authenticated deletes
DROP POLICY IF EXISTS "Allow authenticated deletes from medical-reports" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from medical-reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'medical-reports');

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to log report actions
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-log report actions
DROP TRIGGER IF EXISTS log_medical_report_action_trigger ON medical_reports;
CREATE TRIGGER log_medical_report_action_trigger
  AFTER INSERT OR DELETE ON medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION log_medical_report_action();

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Medical Reports schema created successfully!' as message;
