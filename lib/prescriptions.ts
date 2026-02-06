import { supabase } from "./supabase";
import {
  Prescription,
  PrescriptionWithDetails,
  PrescriptionLog,
  UserRole,
} from "./database.types";
import { logAction } from "./logging";

// Create a new prescription
export async function createPrescription(
  prescriptionData: Omit<Prescription, "id" | "created_at" | "updated_at">,
  doctorId: string
): Promise<{ success: boolean; data?: Prescription; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .insert([prescriptionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating prescription:", error);
      return { success: false, error: error.message };
    }

    // Log the prescription creation
    await supabase.from("prescription_logs").insert({
      prescription_id: data.id,
      action_type: "created",
      performed_by_user_id: doctorId,
      performed_by_role: "doctor",
      new_data: data,
      metadata: { appointment_id: prescriptionData.appointment_id },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Error creating prescription:", error);
    return { success: false, error: error.message };
  }
}

// Check if appointment has prescriptions
export async function hasAppointmentPrescriptions(
  appointmentId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id")
      .eq("appointment_id", appointmentId)
      .limit(1);

    if (error) {
      console.error("Error checking prescriptions:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking prescriptions:", error);
    return false;
  }
}

// Get prescription count for appointment
export async function getAppointmentPrescriptionCount(
  appointmentId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id")
      .eq("appointment_id", appointmentId);

    if (error) {
      console.error("Error getting prescription count:", error);
      return 0;
    }

    return data ? data.length : 0;
  } catch (error) {
    console.error("Error getting prescription count:", error);
    return 0;
  }
}

// Get patient prescriptions
export async function getPatientPrescriptions(
  patientId: string,
  userRole: UserRole | string = "patient", // Default to patient
  userId: string = patientId // Default to patientId
): Promise<PrescriptionWithDetails[]> {
  try {
    // Log the view action
    if (userId && userRole) {
      logAction({
        userId: userId,
        userRole: userRole as UserRole,
        action: "view_prescriptions_list",
        resourceType: "prescriptions",
        resourceId: patientId,
      }).catch((err) => console.error("Failed to log prescription view:", err));
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .select(
        `
        *,
        doctors (
          first_name,
          last_name,
          specialization
        )
      `
      )
      .eq("patient_id", patientId)
      .order("prescribed_date", { ascending: false });

    if (error) {
      console.error("Error fetching prescriptions:", error);
      return [];
    }

    return (data || []).map((rx: any) => ({
      ...rx,
      doctor_name: `Dr. ${rx.doctors.first_name} ${rx.doctors.last_name}`,
      doctor_specialization: rx.doctors.specialization,
    }));
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return [];
  }
}

// Get prescriptions for an appointment
export async function getAppointmentPrescriptions(
  appointmentId: string
): Promise<PrescriptionWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
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
        )
      `
      )
      .eq("appointment_id", appointmentId)
      .order("prescribed_date", { ascending: false });

    if (error) {
      console.error("Error fetching appointment prescriptions:", error);
      return [];
    }

    return (data || []).map((rx: any) => ({
      ...rx,
      doctor_name: `Dr. ${rx.doctors.first_name} ${rx.doctors.last_name}`,
      doctor_specialization: rx.doctors.specialization,
      patient_name: `${rx.patients.first_name} ${rx.patients.last_name}`,
    }));
  } catch (error) {
    console.error("Error fetching appointment prescriptions:", error);
    return [];
  }
}

// Update prescription status
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: "active" | "completed" | "discontinued",
  doctorId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current prescription
    const { data: oldData } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .single();

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (notes) {
      updateData.notes = notes;
    }

    const { error } = await supabase
      .from("prescriptions")
      .update(updateData)
      .eq("id", prescriptionId);

    if (error) {
      console.error("Error updating prescription:", error);
      return { success: false, error: error.message };
    }

    // Log the update
    if (oldData) {
      await supabase.from("prescription_logs").insert({
        prescription_id: prescriptionId,
        action_type: status === "discontinued" ? "discontinued" : "updated",
        performed_by_user_id: doctorId,
        performed_by_role: "doctor",
        old_data: oldData,
        new_data: { ...oldData, ...updateData },
        metadata: notes ? { notes } : undefined,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating prescription:", error);
    return { success: false, error: error.message };
  }
}

// Get all prescription logs (admin only)
export async function getPrescriptionLogs(filters?: {
  prescriptionId?: string;
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PrescriptionLog[]> {
  try {
    let query = supabase
      .from("prescription_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (filters?.prescriptionId) {
      query = query.eq("prescription_id", filters.prescriptionId);
    }

    if (filters?.startDate) {
      query = query.gte("timestamp", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("timestamp", filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching prescription logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching prescription logs:", error);
    return [];
  }
}

// Video call functions
export async function startVideoCall(
  appointmentId: string,
  patientId: string,
  doctorId: string
): Promise<{ success: boolean; callLink?: string; error?: string }> {
  try {
    console.log(
      "🎥 [startVideoCall] Starting call for appointment:",
      appointmentId
    );

    // Generate a unique video call link (in production, use actual video service API)
    const callLink = `https://videocall.securehealthcare.com/room/${appointmentId}`;

    const { error: appointmentError } = await supabase
      .from("appointments")
      .update({
        video_call_link: callLink,
        video_call_started_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (appointmentError) {
      console.error("❌ [startVideoCall] Error starting video call:", {
        code: appointmentError.code,
        message: appointmentError.message,
        details: appointmentError.details,
        hint: appointmentError.hint,
      });
      return {
        success: false,
        error: appointmentError.message || "Failed to start video call",
      };
    }

    // Log the video call start (optional - video_call_logs table may not exist)
    try {
      const { error: logError } = await supabase
        .from("video_call_logs")
        .insert({
          appointment_id: appointmentId,
          patient_id: patientId,
          doctor_id: doctorId,
          call_started_at: new Date().toISOString(),
          call_status: "completed",
        });

      if (logError) {
        console.warn(
          "⚠️ [startVideoCall] Could not log video call (table may not exist):",
          {
            code: logError.code,
            message: logError.message,
            details: logError.details,
            hint: logError.hint,
          }
        );
        // Don't fail the whole operation if logging fails
      } else {
        console.log("✅ [startVideoCall] Call logged successfully");
      }
    } catch (logException) {
      console.warn(
        "⚠️ [startVideoCall] Exception logging video call:",
        logException
      );
      // Continue even if logging fails
    }

    console.log("✅ [startVideoCall] Call started successfully:", callLink);
    return { success: true, callLink };
  } catch (error: any) {
    console.error("❌ [startVideoCall] Exception:", error);
    return {
      success: false,
      error: error.message || "Unexpected error starting video call",
    };
  }
}

export async function endVideoCall(
  appointmentId: string,
  qualityRating?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      "🎥 [endVideoCall] Ending call for appointment:",
      appointmentId
    );
    const endTime = new Date().toISOString();

    // Update appointment
    const { error: appointmentError } = await supabase
      .from("appointments")
      .update({
        video_call_ended_at: endTime,
      })
      .eq("id", appointmentId);

    if (appointmentError) {
      console.error("❌ [endVideoCall] Error ending video call:", {
        code: appointmentError.code,
        message: appointmentError.message,
        details: appointmentError.details,
        hint: appointmentError.hint,
      });
      return {
        success: false,
        error: appointmentError.message || "Failed to end video call",
      };
    }

    // Update video call log (optional - table may not exist)
    try {
      const { error: logError } = await supabase
        .from("video_call_logs")
        .update({
          call_ended_at: endTime,
          call_status: "completed",
          quality_rating: qualityRating,
        })
        .eq("appointment_id", appointmentId)
        .is("call_ended_at", null);

      if (logError) {
        console.warn("⚠️ [endVideoCall] Could not update video call log:", {
          code: logError.code,
          message: logError.message,
          details: logError.details,
          hint: logError.hint,
        });
        // Don't fail the whole operation if logging fails
      } else {
        console.log("✅ [endVideoCall] Call log updated successfully");
      }
    } catch (logException) {
      console.warn(
        "⚠️ [endVideoCall] Exception updating video call log:",
        logException
      );
      // Continue even if logging fails
    }

    console.log("✅ [endVideoCall] Call ended successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ [endVideoCall] Exception:", error);
    return {
      success: false,
      error: error.message || "Unexpected error ending video call",
    };
  }
}

// Get video call logs (admin only)
export async function getVideoCallLogs(filters?: {
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any[]> {
  try {
    let query = supabase
      .from("video_call_logs")
      .select(
        `
        *,
        appointments (
          appointment_date,
          appointment_time,
          is_telemedicine
        ),
        patients (
          first_name,
          last_name,
          email
        ),
        doctors (
          first_name,
          last_name,
          specialization
        )
      `
      )
      .order("call_started_at", { ascending: false });

    if (filters?.appointmentId) {
      query = query.eq("appointment_id", filters.appointmentId);
    }

    if (filters?.patientId) {
      query = query.eq("patient_id", filters.patientId);
    }

    if (filters?.doctorId) {
      query = query.eq("doctor_id", filters.doctorId);
    }

    if (filters?.startDate) {
      query = query.gte("call_started_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("call_started_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching video call logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching video call logs:", error);
    return [];
  }
}

// Pharmacy Management Functions

// Search prescriptions for pharmacy (staff role)
export async function searchPrescriptionsForPharmacy(filters: {
  patientId?: string;
  patientName?: string;
  status?: "active" | "completed" | "discontinued" | "all";
}): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters.patientId) params.append("patientId", filters.patientId);
    if (filters.patientName) params.append("patientName", filters.patientName);
    if (filters.status) params.append("status", filters.status);

    const response = await fetch(`/api/prescriptions/search?${params}`);
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to search prescriptions",
      };
    }

    return { success: true, data: result.prescriptions || [] };
  } catch (error: any) {
    console.error("Error searching prescriptions:", error);
    return { success: false, error: error.message };
  }
}

// Mark prescription as dispensed (pharmacy staff)
export async function markPrescriptionDispensed(
  prescriptionId: string,
  staffId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current prescription
    const { data: oldData } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .single();

    const updateData: any = {
      status: "completed",
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = oldData?.notes
        ? `${oldData.notes}\n[Pharmacy] ${notes}`
        : `[Pharmacy] ${notes}`;
    }

    const { error } = await supabase
      .from("prescriptions")
      .update(updateData)
      .eq("id", prescriptionId);

    if (error) {
      console.error("Error marking prescription as dispensed:", error);
      return { success: false, error: error.message };
    }

    // Log the dispensing action
    if (oldData) {
      await supabase.from("prescription_logs").insert({
        prescription_id: prescriptionId,
        action_type: "updated",
        performed_by_user_id: staffId,
        performed_by_role: "staff",
        old_data: oldData,
        new_data: { ...oldData, ...updateData },
        metadata: { action: "dispensed", notes },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error marking prescription as dispensed:", error);
    return { success: false, error: error.message };
  }
}
