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

export interface MedicalRecord {
  id?: string;
  patient_id: string;
  doctor_id?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  visit_date?: string;
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
