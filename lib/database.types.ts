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

export type UserRole = "patient" | "doctor" | "nurse" | "staff" | "admin";

export interface LoginCredentials {
  identifier: string;
  password: string;
  role: UserRole;
}
