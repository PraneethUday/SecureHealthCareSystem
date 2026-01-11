import { supabase } from "./supabase";
import {
  MedicalRecord,
  MedicalRecordWithDetails,
  MedicalRecordLog,
} from "./database.types";

// Create a new medical record
export async function createMedicalRecord(
  recordData: Omit<MedicalRecord, "id" | "created_at" | "updated_at">,
  doctorId: string
): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
  try {
    console.log("Creating medical record:", recordData);

    const { data, error } = await supabase
      .from("medical_records")
      .insert([recordData])
      .select()
      .single();

    if (error) {
      console.error("Error creating medical record:", error);
      const errorMessage =
        error.message || error.details || JSON.stringify(error);
      return {
        success: false,
        error: `Failed to create medical record: ${errorMessage}`,
      };
    }

    if (!data) {
      return { success: false, error: "No data returned from insert" };
    }

    console.log("Medical record created successfully:", data);

    // Log the creation
    await supabase.from("medical_record_logs").insert({
      medical_record_id: data.id,
      action_type: "created",
      performed_by_user_id: doctorId,
      performed_by_role: "doctor",
      new_data: data,
      metadata: { appointment_id: recordData.appointment_id },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Caught error in createMedicalRecord:", error);
    const errorMessage =
      error.message || error.toString() || "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

// Get patient medical records
export async function getPatientMedicalRecords(
  patientId: string
): Promise<MedicalRecordWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from("medical_records")
      .select(
        `
        *,
        doctors (
          first_name,
          last_name,
          specialization
        ),
        appointments (
          appointment_date,
          appointment_time
        )
      `
      )
      .eq("patient_id", patientId)
      .order("record_date", { ascending: false });

    if (error) {
      console.error("Error fetching medical records:", error);
      return [];
    }

    return (data || []).map((record: any) => ({
      ...record,
      doctor_name: record.doctors
        ? `${record.doctors.first_name} ${record.doctors.last_name}`
        : undefined,
      doctor_specialization: record.doctors?.specialization,
      appointment_date: record.appointments?.appointment_date,
      appointment_time: record.appointments?.appointment_time,
    }));
  } catch (error) {
    console.error("Error in getPatientMedicalRecords:", error);
    return [];
  }
}

// Get medical record by ID
export async function getMedicalRecordById(
  recordId: string,
  userId: string
): Promise<{
  success: boolean;
  data?: MedicalRecordWithDetails;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("medical_records")
      .select(
        `
        *,
        doctors (
          first_name,
          last_name,
          specialization
        ),
        patients (
          first_name,
          last_name
        ),
        appointments (
          appointment_date,
          appointment_time
        )
      `
      )
      .eq("id", recordId)
      .single();

    if (error) {
      console.error("Error fetching medical record:", error);
      return { success: false, error: error.message };
    }

    // Log the view
    await supabase.from("medical_record_logs").insert({
      medical_record_id: recordId,
      action_type: "viewed",
      performed_by_user_id: userId,
      performed_by_role: "patient",
    });

    const record: MedicalRecordWithDetails = {
      ...data,
      doctor_name: data.doctors
        ? `${data.doctors.first_name} ${data.doctors.last_name}`
        : undefined,
      doctor_specialization: data.doctors?.specialization,
      patient_name: data.patients
        ? `${data.patients.first_name} ${data.patients.last_name}`
        : undefined,
      appointment_date: data.appointments?.appointment_date,
      appointment_time: data.appointments?.appointment_time,
    };

    return { success: true, data: record };
  } catch (error: any) {
    console.error("Error in getMedicalRecordById:", error);
    return { success: false, error: error.message };
  }
}

// Update medical record
export async function updateMedicalRecord(
  recordId: string,
  updates: Partial<MedicalRecord>,
  doctorId: string
): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
  try {
    // Get old data first
    const { data: oldData } = await supabase
      .from("medical_records")
      .select("*")
      .eq("id", recordId)
      .single();

    const { data, error } = await supabase
      .from("medical_records")
      .update(updates)
      .eq("id", recordId)
      .select()
      .single();

    if (error) {
      console.error("Error updating medical record:", error);
      return { success: false, error: error.message };
    }

    // Log the update
    await supabase.from("medical_record_logs").insert({
      medical_record_id: recordId,
      action_type: "updated",
      performed_by_user_id: doctorId,
      performed_by_role: "doctor",
      old_data: oldData,
      new_data: data,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Error in updateMedicalRecord:", error);
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
