export interface Admin {
  id: "admin";
  password: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id?: string;
  patient_id: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  health_profile?: any;
  is_profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Doctor {
  id?: string;
  doctor_id: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization: string;
  license_number: string;
  department?: string;
  years_of_experience?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Nurse {
  id?: string;
  nurse_id: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  license_number: string;
  department?: string;
  shift?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Staff {
  id?: string;
  staff_id: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccessLog {
  id?: string;
  user_role: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  timestamp?: string;
  ip_address?: string;
  user_agent?: string;
  audit_hash?: string;
  blockchain_tx_hash?: string;
  blockchain_verified?: boolean;
  verified_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  phone: string;
  email?: string;
  departments?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";
export type AppointmentActionType =
  | "created"
  | "updated"
  | "cancelled"
  | "completed"
  | "rescheduled";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancellation_reason?: string;
  is_telemedicine?: boolean;
  video_call_link?: string;
  video_call_started_at?: string;
  video_call_ended_at?: string;
  share_health_profile?: boolean;
  nurse_id?: string; // UUID reference to nurses table
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentWithDetails extends Appointment {
  patient_name?: string;
  patient_email?: string;
  doctor_name?: string;
  specialization?: string;
  hospital_name?: string;
  hospital_address?: string;
  nurse_name?: string;
  nurse_id_string?: string; // The nurse's readable ID (e.g., N001)
}

export interface AppointmentLog {
  id: string;
  appointment_id: string;
  action_type: AppointmentActionType;
  performed_by_user_id: string;
  performed_by_role: string;
  old_status?: AppointmentStatus;
  new_status?: AppointmentStatus;
  metadata?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export type UserRole = "patient" | "doctor" | "nurse" | "staff" | "admin";

export interface LoginCredentials {
  identifier: string;
  password: string;
  role: UserRole;
}

export interface Prescription {
  id: string;
  appointment_id?: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  notes?: string;
  prescribed_date: string;
  start_date: string;
  end_date?: string;
  status: "active" | "completed" | "discontinued";
  created_at?: string;
  updated_at?: string;
}

export interface PrescriptionWithDetails extends Prescription {
  doctor_name?: string;
  doctor_specialization?: string;
  patient_name?: string;
}

export interface PrescriptionLog {
  id: string;
  prescription_id: string;
  action_type: "created" | "updated" | "discontinued";
  performed_by_user_id: string;
  performed_by_role: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface VideoCallLog {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  call_started_at: string;
  call_ended_at?: string;
  duration_minutes?: number;
  call_status?: "completed" | "interrupted" | "failed";
  quality_rating?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface MedicalRecord {
  id: string;
  appointment_id?: string;
  patient_id: string;
  doctor_id: string;

  // Chief Complaint & Diagnosis
  chief_complaint: string;
  diagnosis: string;

  // Vital Signs
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;

  // Clinical Notes
  symptoms?: string;
  examination_findings?: string;
  treatment_plan?: string;
  recommendations?: string;
  follow_up_instructions?: string;

  // Lab Results & Tests
  lab_results?: string;
  test_results?: string;

  // Allergies & Medical History
  allergies?: string;
  current_medications?: string;
  past_medical_history?: string;

  // Additional Information
  notes?: string;

  // Metadata
  record_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicalRecordWithDetails extends MedicalRecord {
  doctor_name?: string;
  doctor_specialization?: string;
  patient_name?: string;
  appointment_date?: string;
  appointment_time?: string;
}

export interface MedicalRecordLog {
  id: string;
  medical_record_id: string;
  action_type: "created" | "updated" | "viewed" | "downloaded";
  performed_by_user_id: string;
  performed_by_role: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Medical Reports/Documents
export type MedicalReportType =
  | "blood_test"
  | "scan"
  | "xray"
  | "mri"
  | "ct_scan"
  | "ultrasound"
  | "ecg"
  | "pathology"
  | "lab_report"
  | "radiology"
  | "other";

export interface MedicalReport {
  id: string;
  patient_id: string;
  uploaded_by_user_id: string;
  uploaded_by_role: "nurse" | "doctor" | "staff";
  report_type: MedicalReportType;
  report_name: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  report_date: string;
  uploaded_at: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface MedicalReportWithDetails extends MedicalReport {
  patient_name?: string;
  patient_email?: string;
  uploaded_by_name?: string;
}

export interface MedicalReportLog {
  id: string;
  report_id: string;
  action_type: "uploaded" | "viewed" | "downloaded" | "deleted";
  performed_by_user_id: string;
  performed_by_role: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
