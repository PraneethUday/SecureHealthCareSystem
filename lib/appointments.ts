import { supabase } from "./supabase";
import {
  Appointment,
  AppointmentWithDetails,
  Hospital,
  AppointmentStatus,
} from "./database.types";

// Fetch all hospitals
export async function getHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from("hospitals")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching hospitals:", error);
    return [];
  }

  return data || [];
}

// Fetch doctors by hospital and/or specialization
export async function getDoctors(hospitalId?: string, specialization?: string) {
  let query = supabase
    .from("doctors")
    .select("id, doctor_id, first_name, last_name, specialization, department");

  if (specialization) {
    query = query.eq("specialization", specialization);
  }

  const { data, error } = await query.order("last_name");

  if (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }

  return data || [];
}

// Get available time slots for a doctor on a specific date
export async function getAvailableTimeSlots(
  doctorId: string,
  date: string
): Promise<string[]> {
  // Fetch existing appointments for this doctor on this date
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("appointment_time")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", date)
    .neq("status", "cancelled");

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const allSlots: string[] = [];
  for (let hour = 9; hour < 17; hour++) {
    allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  // Filter out booked slots
  const bookedTimes =
    appointments?.map((a) => a.appointment_time.substring(0, 5)) || [];
  return allSlots.filter((slot) => !bookedTimes.includes(slot));
}

// Create new appointment
export async function createAppointment(appointmentData: {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  notes?: string;
  isTelemedicine?: boolean;
}): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    console.log("Creating appointment with data:", appointmentData);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: appointmentData.patientId,
        doctor_id: appointmentData.doctorId,
        hospital_id: appointmentData.hospitalId,
        appointment_date: appointmentData.appointmentDate,
        appointment_time: appointmentData.appointmentTime,
        reason: appointmentData.reason,
        notes: appointmentData.notes,
        is_telemedicine: appointmentData.isTelemedicine || false,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      const errorMessage =
        error.message || error.details || JSON.stringify(error);
      return {
        success: false,
        error: `Failed to create appointment: ${errorMessage}`,
      };
    }

    if (!data) {
      return { success: false, error: "No data returned from insert" };
    }

    console.log("Appointment created successfully:", data);

    // Log the appointment creation
    const actionType: "created" = "created";
    const logResult = await supabase.from("appointment_logs").insert({
      appointment_id: data.id,
      action_type: actionType,
      performed_by_user_id: appointmentData.patientId,
      performed_by_role: "patient",
      new_status: "scheduled",
      metadata: {
        hospital_id: appointmentData.hospitalId,
        doctor_id: appointmentData.doctorId,
        date: appointmentData.appointmentDate,
        time: appointmentData.appointmentTime,
      },
    });

    if (logResult.error) {
      console.error("Error logging appointment creation:", logResult.error);
    }

    return { success: true, appointment: data };
  } catch (error: any) {
    console.error("Caught error in createAppointment:", error);
    const errorMessage =
      error.message || error.toString() || "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

// Get patient appointments
export async function getPatientAppointments(
  patientId: string
): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      doctors (
        id,
        first_name,
        last_name,
        specialization
      ),
      hospitals (
        id,
        name,
        address
      )
    `
    )
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  if (error) {
    console.error("Error fetching patient appointments:", error);
    return [];
  }

  // Transform the data
  return (data || []).map((apt) => ({
    ...apt,
    doctor_name: `${apt.doctors.first_name} ${apt.doctors.last_name}`,
    specialization: apt.doctors.specialization,
    hospital_name: apt.hospitals.name,
    hospital_address: apt.hospitals.address,
  }));
}

// Get doctor appointments
export async function getDoctorAppointments(
  doctorId: string
): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patients (
        id,
        first_name,
        last_name,
        email,
        phone_number
      ),
      hospitals (
        id,
        name,
        address
      )
    `
    )
    .eq("doctor_id", doctorId)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    console.error("Error fetching doctor appointments:", error);
    return [];
  }

  // Transform the data
  return (data || []).map((apt) => ({
    ...apt,
    patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
    patient_email: apt.patients.email,
    hospital_name: apt.hospitals.name,
    hospital_address: apt.hospitals.address,
  }));
}

// Update appointment status
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  userId?: string,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    console.log("Updating appointment:", { appointmentId, status, userId });

    // Get current appointment to log the change
    const { data: currentAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (fetchError) {
      console.error("Error fetching appointment:", fetchError);
      return {
        success: false,
        error: `Failed to fetch appointment: ${
          fetchError.message || JSON.stringify(fetchError)
        }`,
      };
    }

    if (!currentAppointment) {
      return { success: false, error: "Appointment not found" };
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }

    console.log("Update data:", updateData);

    const { data: updatedData, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      const errorMessage =
        error.message || error.details || JSON.stringify(error);
      return {
        success: false,
        error: `Failed to update appointment: ${errorMessage}`,
      };
    }

    if (!updatedData) {
      return { success: false, error: "No data returned from update" };
    }

    console.log("Update successful:", updatedData);

    // Log the status change if userId provided
    if (userId && currentAppointment) {
      // Determine action type based on status change
      let actionType:
        | "created"
        | "updated"
        | "cancelled"
        | "completed"
        | "rescheduled";
      if (status === "cancelled") {
        actionType = "cancelled";
      } else if (status === "completed") {
        actionType = "completed";
      } else {
        actionType = "updated";
      }

      const logResult = await supabase.from("appointment_logs").insert({
        appointment_id: appointmentId,
        action_type: actionType,
        performed_by_user_id: userId,
        performed_by_role: status === "cancelled" ? "patient" : "doctor",
        old_status: currentAppointment.status,
        new_status: status,
        metadata: cancellationReason
          ? { reason: cancellationReason }
          : undefined,
      });

      if (logResult.error) {
        console.error("Error logging appointment change:", logResult.error);
      }
    }

    return { success: true, data: updatedData };
  } catch (error: any) {
    console.error("Caught error in updateAppointmentStatus:", error);
    const errorMessage =
      error.message || error.toString() || "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

// Cancel appointment
export async function cancelAppointment(
  appointmentId: string,
  userId?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(
    appointmentId,
    "cancelled",
    userId,
    reason || "Cancelled by patient"
  );
}

// Complete appointment
export async function completeAppointment(
  appointmentId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(appointmentId, "completed", userId);
}

// Get all appointment logs (admin only)
export async function getAppointmentLogs(filters?: {
  startDate?: string;
  endDate?: string;
  role?: string;
  actionType?: string;
  userId?: string;
}) {
  let query = supabase
    .from("appointment_logs")
    .select(
      `
      *,
      appointments (
        appointment_date,
        appointment_time,
        status
      )
    `
    )
    .order("timestamp", { ascending: false });

  if (filters?.startDate) {
    query = query.gte("timestamp", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("timestamp", filters.endDate);
  }
  if (filters?.role) {
    query = query.eq("performed_by_role", filters.role);
  }
  if (filters?.actionType) {
    query = query.eq("action_type", filters.actionType);
  }
  if (filters?.userId) {
    query = query.eq("performed_by_user_id", filters.userId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error("Error fetching appointment logs:", error);
    return [];
  }

  return data || [];
}
