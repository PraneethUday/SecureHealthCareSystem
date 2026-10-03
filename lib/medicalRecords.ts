import { supabase } from "./supabase";
import { logAction } from "./logging";
import {
  MedicalRecord,
  MedicalRecordWithDetails,
  MedicalRecordLog,
  UserRole,
} from "./database.types";

// Clinical fields are encrypted at rest, so records are read and written
// through the server (app/api/clinical/*), which encrypts/decrypts them for
// callers RLS allows. The browser never sees ciphertext or keys.
async function clinicalFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function withRecordDetails(record: any): MedicalRecordWithDetails {
  return {
    ...record,
    doctor_name: record.doctors
      ? `${record.doctors.first_name} ${record.doctors.last_name}`
      : undefined,
    doctor_specialization: record.doctors?.specialization,
    patient_name: record.patients
      ? `${record.patients.first_name} ${record.patients.last_name}`
      : undefined,
    appointment_date: record.appointments?.appointment_date,
    appointment_time: record.appointments?.appointment_time,
  };
}


// Create a new medical record
export async function createMedicalRecord(
  recordData: Omit<MedicalRecord, "id" | "created_at" | "updated_at">,
  _doctorId: string
): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
  try {
    const { record } = await clinicalFetch("/api/clinical/medical-records", {
      method: "POST",
      body: JSON.stringify(recordData),
    });
    return { success: true, data: record };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPatientMedicalRecords(
  patientId: string,
  _userRole: UserRole | string = "patient",
  _userId: string = patientId
): Promise<MedicalRecordWithDetails[]> {
  try {
    const { records } = await clinicalFetch(
      `/api/clinical/medical-records?patientId=${encodeURIComponent(patientId)}`,
    );
    return (records ?? []).map(withRecordDetails);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return [];
  }
}

export async function getMedicalRecordById(
  recordId: string,
  _userId: string
): Promise<{
  success: boolean;
  data?: MedicalRecordWithDetails;
  error?: string;
}> {
  try {
    const { records } = await clinicalFetch(
      `/api/clinical/medical-records?id=${encodeURIComponent(recordId)}`,
    );
    if (!records?.length) return { success: false, error: "Record not found" };
    return { success: true, data: withRecordDetails(records[0]) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update medical record
export async function updateMedicalRecord(
  recordId: string,
  updates: Partial<MedicalRecord>,
  _doctorId: string
): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
  try {
    const { record } = await clinicalFetch("/api/clinical/medical-records", {
      method: "PATCH",
      body: JSON.stringify({ id: recordId, updates }),
    });
    return { success: true, data: record };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Log PDF download
export async function logMedicalRecordDownload(
  recordId: string,
  userId: string,
  userRole: string
): Promise<void> {
  try {
    await supabase.from("medical_record_logs").insert({
      medical_record_id: recordId,
      action_type: "downloaded",
      performed_by_user_id: userId,
      performed_by_role: userRole,
      metadata: { download_format: "pdf" },
    });
  } catch (error) {
    console.error("Error logging download:", error);
  }
}

// Get medical record logs (for admin)
export async function getMedicalRecordLogs(filters?: {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<MedicalRecordLog[]> {
  try {
    let query = supabase
      .from("medical_record_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (filters?.startDate) {
      query = query.gte("timestamp", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("timestamp", filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching medical record logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getMedicalRecordLogs:", error);
    return [];
  }
}

// Check if appointment has medical record
export async function hasAppointmentMedicalRecord(
  appointmentId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("medical_records")
      .select("id")
      .eq("appointment_id", appointmentId)
      .limit(1);

    if (error) {
      console.error("Error checking medical record:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error in hasAppointmentMedicalRecord:", error);
    return false;
  }
}
