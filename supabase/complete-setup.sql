-- ======================================================================================================
-- SECURE HEALTHCARE SYSTEM - COMPLETE DATABASE SETUP (ALL-IN-ONE)
-- Run this ONCE in Supabase SQL Editor to create ALL tables and configurations
-- This file includes: Base tables, Chat, Medical Reports, OTP/MFA, and all missing columns
-- ======================================================================================================
-- Version: 2.0
-- Last Updated: 2026-02-10
-- ======================================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ######################################################################################################
-- SECTION 1: BASE USER TABLES
-- ######################################################################################################

-- Admin table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY CHECK (id = 'admin'),
  password TEXT NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  blood_group TEXT,
  allergies TEXT,
  medical_history TEXT,
  current_medications TEXT,
  health_profile JSONB,
  is_profile_completed BOOLEAN DEFAULT false,
  is_mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  mfa_method TEXT DEFAULT 'email',
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialization TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  department TEXT,
  years_of_experience INTEGER,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Nurses table
CREATE TABLE IF NOT EXISTS nurses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  license_number TEXT UNIQUE NOT NULL,
  department TEXT,
  shift TEXT,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  department TEXT,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for user tables
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_doctor_id ON doctors(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_nurses_nurse_id ON nurses(nurse_id);
CREATE INDEX IF NOT EXISTS idx_nurses_email ON nurses(email);
CREATE INDEX IF NOT EXISTS idx_staff_staff_id ON staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);


-- ######################################################################################################
-- SECTION 2: AUTHENTICATION & AUDIT TABLES
-- ######################################################################################################

-- OTP Logs table (for MFA/2FA)
CREATE TABLE IF NOT EXISTS otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_used BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_otp_logs_user ON otp_logs(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires ON otp_logs(expires_at);

-- Login Audit table
CREATE TABLE IF NOT EXISTS login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  login_status TEXT NOT NULL,
  mfa_verified BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_login_audit_status ON login_audit(login_status);
CREATE INDEX IF NOT EXISTS idx_login_audit_created ON login_audit(created_at DESC);

-- Password History table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_password_history_changed ON password_history(changed_at DESC);

-- Access Logs table (with all required columns)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  status TEXT,
  blockchain_verified BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);


-- ######################################################################################################
-- SECTION 3: HOSPITALS & APPOINTMENTS
-- ######################################################################################################

-- Create enum types
DO $$
BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE action_type AS ENUM ('created', 'updated', 'cancelled', 'completed', 'rescheduled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  departments TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON hospitals(is_active);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  nurse_id UUID REFERENCES nurses(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  share_health_profile BOOLEAN DEFAULT false,
  is_telemedicine BOOLEAN DEFAULT false,
  video_call_link TEXT,
  video_call_started_at TIMESTAMP WITH TIME ZONE,
  video_call_ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_doctor_time UNIQUE (doctor_id, appointment_date, appointment_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nurse ON appointments(nurse_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_telemedicine ON appointments(is_telemedicine) WHERE is_telemedicine = true;

-- Appointment Logs table
CREATE TABLE IF NOT EXISTS appointment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_status appointment_status,
  new_status appointment_status,
  metadata JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_appointment_logs_appointment ON appointment_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_user ON appointment_logs(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_timestamp ON appointment_logs(timestamp DESC);


-- ######################################################################################################
-- SECTION 4: MEDICAL RECORDS & PRESCRIPTIONS
-- ######################################################################################################

-- Medical Records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  chief_complaint TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  blood_pressure VARCHAR(20),
  heart_rate INTEGER,
  temperature DECIMAL(4,2),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  symptoms TEXT,
  examination_findings TEXT,
  treatment_plan TEXT,
  recommendations TEXT,
  follow_up_instructions TEXT,
  lab_results TEXT,
  test_results TEXT,
  allergies TEXT,
  current_medications TEXT,
  past_medical_history TEXT,
  notes TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(record_date DESC);

-- Medical Record Logs table
CREATE TABLE IF NOT EXISTS medical_record_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_medical_record_logs_record ON medical_record_logs(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_logs_timestamp ON medical_record_logs(timestamp DESC);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  notes TEXT,
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescribed_date DESC);

-- Prescription Logs table
CREATE TABLE IF NOT EXISTS prescription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_prescription_logs_prescription ON prescription_logs(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_logs_timestamp ON prescription_logs(timestamp DESC);


-- ######################################################################################################
-- SECTION 5: MEDICAL REPORTS UPLOAD
-- ######################################################################################################

-- Medical Reports table
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
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800)
);

CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_type ON medical_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_medical_reports_date ON medical_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_reports_uploader ON medical_reports(uploaded_by_user_id, uploaded_by_role);

-- Medical Report Logs table
CREATE TABLE IF NOT EXISTS medical_report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES medical_reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('uploaded', 'viewed', 'downloaded', 'deleted')),
  performed_by_user_id TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_medical_report_logs_report ON medical_report_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_medical_report_logs_timestamp ON medical_report_logs(timestamp DESC);


-- ######################################################################################################
-- SECTION 6: CHAT SYSTEM
-- ######################################################################################################

-- Chat Conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_appointment_conversation UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_appointment ON chat_conversations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_patient ON chat_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_doctor ON chat_conversations(doctor_id);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Chat Attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_attachment_size CHECK (file_size > 0 AND file_size <= 10485760)
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);


-- ######################################################################################################
-- SECTION 7: VIDEO CALLS (WebRTC)
-- ######################################################################################################

-- Video Call Logs table
CREATE TABLE IF NOT EXISTS video_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  call_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  call_status TEXT,
  quality_rating INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_video_call_logs_appointment ON video_call_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_date ON video_call_logs(call_started_at DESC);

-- Video Calls table
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'calling',
  initiated_by_role TEXT NOT NULL,
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  recording_url TEXT,
  quality_metrics JSONB,
  error_logs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_video_calls_appointment ON video_calls(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_patient ON video_calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_doctor ON video_calls(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);

-- Video Call Signaling table
CREATE TABLE IF NOT EXISTS video_call_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL,
  from_user_role TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_video_call_signaling_call ON video_call_signaling(video_call_id);


-- ######################################################################################################
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ######################################################################################################

-- Enable RLS on all tables
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_report_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_signaling ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (app handles authorization)
DROP POLICY IF EXISTS "Allow all otp_logs operations" ON otp_logs;
CREATE POLICY "Allow all otp_logs operations" ON otp_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all login_audit operations" ON login_audit;
CREATE POLICY "Allow all login_audit operations" ON login_audit FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all password_history operations" ON password_history;
CREATE POLICY "Allow all password_history operations" ON password_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all hospital operations" ON hospitals;
CREATE POLICY "Allow all hospital operations" ON hospitals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all appointment operations" ON appointments;
CREATE POLICY "Allow all appointment operations" ON appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all appointment log operations" ON appointment_logs;
CREATE POLICY "Allow all appointment log operations" ON appointment_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all medical record operations" ON medical_records;
CREATE POLICY "Allow all medical record operations" ON medical_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all medical record log operations" ON medical_record_logs;
CREATE POLICY "Allow all medical record log operations" ON medical_record_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all prescription operations" ON prescriptions;
CREATE POLICY "Allow all prescription operations" ON prescriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all prescription log operations" ON prescription_logs;
CREATE POLICY "Allow all prescription log operations" ON prescription_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all medical report operations" ON medical_reports;
CREATE POLICY "Allow all medical report operations" ON medical_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all medical report log operations" ON medical_report_logs;
CREATE POLICY "Allow all medical report log operations" ON medical_report_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat conversation operations" ON chat_conversations;
CREATE POLICY "Allow all chat conversation operations" ON chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat message operations" ON chat_messages;
CREATE POLICY "Allow all chat message operations" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat attachment operations" ON chat_attachments;
CREATE POLICY "Allow all chat attachment operations" ON chat_attachments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all video call log operations" ON video_call_logs;
CREATE POLICY "Allow all video call log operations" ON video_call_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all video call operations" ON video_calls;
CREATE POLICY "Allow all video call operations" ON video_calls FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all video call signaling operations" ON video_call_signaling;
CREATE POLICY "Allow all video call signaling operations" ON video_call_signaling FOR ALL USING (true) WITH CHECK (true);


-- ######################################################################################################
-- SECTION 9: HELPER FUNCTIONS & TRIGGERS
-- ######################################################################################################

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
DROP TRIGGER IF EXISTS update_appointments_timestamp ON appointments;
CREATE TRIGGER update_appointments_timestamp BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_medical_records_timestamp ON medical_records;
CREATE TRIGGER update_medical_records_timestamp BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_video_calls_timestamp ON video_calls;
CREATE TRIGGER update_video_calls_timestamp BEFORE UPDATE ON video_calls FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_chat_conversations_timestamp ON chat_conversations;
CREATE TRIGGER update_chat_conversations_timestamp BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to calculate video call duration
CREATE OR REPLACE FUNCTION calc_video_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.call_ended_at IS NOT NULL AND NEW.call_started_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.call_ended_at - NEW.call_started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calc_video_call_duration_trigger ON video_call_logs;
CREATE TRIGGER calc_video_call_duration_trigger BEFORE INSERT OR UPDATE ON video_call_logs FOR EACH ROW EXECUTE FUNCTION calc_video_call_duration();

-- Function to update conversation timestamp when new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_new_message ON chat_messages;
CREATE TRIGGER update_conversation_on_new_message AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(conv_id UUID, user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM chat_messages
    WHERE conversation_id = conv_id
      AND sender_id != user_id
      AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to log medical report actions
CREATE OR REPLACE FUNCTION log_medical_report_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO medical_report_logs (
      report_id, action_type, performed_by_user_id, performed_by_role, metadata
    ) VALUES (
      NEW.id, 'uploaded', NEW.uploaded_by_user_id, NEW.uploaded_by_role,
      jsonb_build_object('report_name', NEW.report_name, 'report_type', NEW.report_type, 'file_size', NEW.file_size)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO medical_report_logs (
      report_id, action_type, performed_by_user_id, performed_by_role, metadata
    ) VALUES (
      OLD.id, 'deleted', OLD.uploaded_by_user_id, OLD.uploaded_by_role,
      jsonb_build_object('report_name', OLD.report_name, 'report_type', OLD.report_type)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_medical_report_action_trigger ON medical_reports;
CREATE TRIGGER log_medical_report_action_trigger
  AFTER INSERT OR DELETE ON medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION log_medical_report_action();


-- ######################################################################################################
-- SECTION 10: ENABLE REALTIME
-- ######################################################################################################

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE video_calls';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;


-- ######################################################################################################
-- SECTION 11: SEED DATA
-- ######################################################################################################

-- Insert Tamil Nadu Hospitals
INSERT INTO hospitals (id, name, address, city, state, phone, departments) VALUES
('11111111-1111-1111-1111-111111111111', 'Apollo Hospitals', '21 Greams Lane', 'Chennai', 'Tamil Nadu', '044-2829-3333', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Emergency']),
('22222222-2222-2222-2222-222222222222', 'Fortis Malar Hospital', '52 Gandhi Nagar', 'Chennai', 'Tamil Nadu', '044-4289-2222', ARRAY['Orthopedics', 'Cardiology', 'Pediatrics', 'Surgery']),
('33333333-3333-3333-3333-333333333333', 'KMCH Hospital', 'Avanashi Road', 'Coimbatore', 'Tamil Nadu', '0422-4344-444', ARRAY['Cardiology', 'Neurology', 'Emergency', 'ICU']),
('44444444-4444-4444-4444-444444444444', 'PSG Hospitals', 'Peelamedu', 'Coimbatore', 'Tamil Nadu', '0422-2570-170', ARRAY['General Medicine', 'Pediatrics', 'Orthopedics', 'Surgery']),
('55555555-5555-5555-5555-555555555555', 'Kauvery Hospital', 'Trichy Road', 'Tiruchirappalli', 'Tamil Nadu', '0431-4077-777', ARRAY['Cardiology', 'Oncology', 'Neurology', 'Emergency']),
('66666666-6666-6666-6666-666666666666', 'Velammal Medical College Hospital', 'Anuppanadi', 'Madurai', 'Tamil Nadu', '0452-2989-878', ARRAY['General Medicine', 'Pediatrics', 'Surgery', 'ICU']),
('77777777-7777-7777-7777-777777777777', 'Vijaya Hospital', 'Vadapalani', 'Chennai', 'Tamil Nadu', '044-2361-2364', ARRAY['Cardiology', 'Orthopedics', 'Neurology', 'Emergency']),
('88888888-8888-8888-8888-888888888888', 'GEM Hospital', 'Ramanathapuram', 'Coimbatore', 'Tamil Nadu', '0422-2324-105', ARRAY['General Medicine', 'Surgery', 'Oncology', 'ICU']),
('99999999-9999-9999-9999-999999999999', 'Rela Hospital', 'Chromepet', 'Chennai', 'Tamil Nadu', '044-4510-2020', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Surgery']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MIOT International', 'Manapakkam', 'Chennai', 'Tamil Nadu', '044-4200-2020', ARRAY['Orthopedics', 'Cardiology', 'Pediatrics', 'Emergency'])
ON CONFLICT (id) DO NOTHING;


-- ######################################################################################################
-- SETUP COMPLETE
-- ######################################################################################################

SELECT '✅ Secure Healthcare System - Complete database setup finished!' as message;
SELECT '📋 All tables, indexes, triggers, and policies have been created.' as info;
SELECT '🔐 Row Level Security (RLS) is enabled with permissive policies.' as security;
SELECT '💬 Chat system, Medical Reports, OTP/MFA, and all features are ready!' as features;
