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
  date: string,
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
  shareHealthProfile?: boolean;
}): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    console.log("Creating appointment with data:", appointmentData);

    const insertData = {
      patient_id: appointmentData.patientId,
      doctor_id: appointmentData.doctorId,
      hospital_id: appointmentData.hospitalId,
      appointment_date: appointmentData.appointmentDate,
      appointment_time: appointmentData.appointmentTime,
      reason: appointmentData.reason,
      notes: appointmentData.notes,
      is_telemedicine: appointmentData.isTelemedicine || false,
      share_health_profile: appointmentData.shareHealthProfile || false,
      status: "scheduled",
    };

    console.log("[Appointments] Insert data:", insertData);
    console.log("[Appointments] Calling Supabase insert...");

    const { data, error } = await supabase
      .from("appointments")
      .insert(insertData)
      .select()
      .single();

    console.log("[Appointments] Supabase response:", { data, error });
    console.log("[Appointments] Error type:", typeof error);
    console.log("[Appointments] Error is null?", error === null);
    console.log("[Appointments] Error stringified:", JSON.stringify(error, null, 2));

    if (error) {
      console.error("Error creating appointment:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Check for duplicate time slot error
      if (error.code === '23505' && error.message?.includes('unique_doctor_time')) {
        return {
          success: false,
          error: "This time slot is already booked for this doctor. Please choose a different time.",
        };
      }

      const errorMessage =
        error.message || error.details || error.hint || JSON.stringify(error);
      return {
        success: false,
        error: `Failed to create appointment: ${errorMessage}`,
      };
    }

    if (!data) {
      console.error("[Appointments] No data returned from insert!");
      return { success: false, error: "No data returned from insert" };
    }

    console.log("Appointment created successfully:", data);

    // Create Zoom meeting for telemedicine appointments
    let zoomMeetingData = null;
    if (appointmentData.isTelemedicine) {
      try {
        console.log("[Appointments] Creating Zoom meeting for telemedicine appointment...");

        // Get patient and doctor names for meeting topic
        const { data: patientData } = await supabase
          .from('patients')
          .select('first_name, last_name')
          .eq('id', appointmentData.patientId)
          .single();

        const { data: doctorData } = await supabase
          .from('doctors')
          .select('first_name, last_name')
          .eq('doctor_id', appointmentData.doctorId)
          .single();

        const patientName = patientData
          ? `${patientData.first_name} ${patientData.last_name}`
          : 'Patient';
        const doctorName = doctorData
          ? `${doctorData.first_name} ${doctorData.last_name}`
          : 'Doctor';

        // Call API route to create Zoom meeting (server-side where env vars are available)
        const response = await fetch('/api/zoom/create-meeting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: data.id,
            patientName,
            doctorName,
            duration: data.duration_minutes || 30,
          }),
        });

        if (response.ok) {
          const { meeting } = await response.json();
          zoomMeetingData = meeting;

          // Update appointment with Zoom details
          try {
            const { error: updateError } = await supabase
              .from('appointments')
              .update({
                zoom_meeting_id: meeting.id,
                zoom_host_url: meeting.start_url,
                zoom_join_url: meeting.join_url,
                zoom_password: meeting.password,
                zoom_created_at: new Date().toISOString(),
                video_call_link: meeting.join_url, // Backward compatibility
              })
              .eq('id', data.id);

            if (updateError) {
              console.error('[Appointments] Error updating appointment with Zoom details:', updateError);
              console.warn('[Appointments] Trying fallback update with just video_call_link...');

              // Fallback: Just update video_call_link if Zoom columns don't exist
              const { error: fallbackError } = await supabase
                .from('appointments')
                .update({
                  video_call_link: meeting.join_url,
                })
                .eq('id', data.id);

              if (fallbackError) {
                console.error('[Appointments] Fallback update also failed:', fallbackError);
              } else {
                console.log('[Appointments] ✅ Zoom meeting created (using fallback video_call_link)');
              }
            } else {
              console.log('[Appointments] ✅ Zoom meeting created and linked to appointment');
            }
          } catch (updateException) {
            console.error('[Appointments] Exception during Zoom update:', updateException);
          }
        } else {
          console.warn('[Appointments] Zoom API call failed, skipping meeting creation');
        }
      } catch (zoomError) {
        console.error('[Appointments] Error creating Zoom meeting:', zoomError);
        // Don't fail the appointment creation if Zoom fails
        // The appointment is still valid, just without a Zoom link
      }
    }

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
        zoom_meeting_created: !!zoomMeetingData,
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
  patientId: string,
): Promise<AppointmentWithDetails[]> {
  try {
    console.log("🔍 Fetching appointments for patient:", patientId);

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
      `,
      )
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (error) {
      console.error("❌ Supabase error fetching patient appointments:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        patientId,
      });
      return [];
    }

    console.log("✅ Successfully fetched appointments:", data?.length || 0);

    // Transform the data
    return (data || []).map((apt) => ({
      ...apt,
      doctor_name: apt.doctors
        ? `${apt.doctors.first_name} ${apt.doctors.last_name}`
        : "Unknown",
      specialization: apt.doctors?.specialization || "N/A",
      hospital_name: apt.hospitals?.name || "N/A",
      hospital_address: apt.hospitals?.address || "N/A",
    }));
  } catch (err) {
    console.error("❌ Exception fetching patient appointments:", err);
    return [];
  }
}

// Get doctor appointments
export async function getDoctorAppointments(
  doctorId: string,
): Promise<AppointmentWithDetails[]> {
  try {
    console.log("🔍 Fetching appointments for doctor:", doctorId);

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
        ),
        nurses (
          id,
          nurse_id,
          first_name,
          last_name
        )
      `,
      )
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("❌ Supabase error fetching doctor appointments:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        doctorId,
      });
      return [];
    }

    console.log("✅ Successfully fetched appointments:", data?.length || 0);

    // Transform the data
    return (data || []).map((apt) => ({
      ...apt,
      patient_name: apt.patients
        ? `${apt.patients.first_name} ${apt.patients.last_name}`
        : "Unknown",
      patient_email: apt.patients?.email || "N/A",
      hospital_name: apt.hospitals?.name || "N/A",
      hospital_address: apt.hospitals?.address || "N/A",
      nurse_name: apt.nurses
        ? `${apt.nurses.first_name} ${apt.nurses.last_name}`
        : undefined,
      nurse_id_string: apt.nurses?.nurse_id || undefined,
    }));
  } catch (err) {
    console.error("❌ Exception fetching doctor appointments:", err);
    return [];
  }
}

// Update appointment status
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  userId?: string,
  cancellationReason?: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    console.log("Updating appointment:", { appointmentId, status, userId });

    // Get current appointment to log the change
    const { data: currentAppointments, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId);

    if (fetchError) {
      console.error("Error fetching appointment:", fetchError);
      return {
        success: false,
        error: `Failed to fetch appointment: ${fetchError.message || JSON.stringify(fetchError)
          }`,
      };
    }

    if (!currentAppointments || currentAppointments.length === 0) {
      return { success: false, error: "Appointment not found" };
    }

    const currentAppointment = currentAppointments[0];

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
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(
    appointmentId,
    "cancelled",
    userId,
    reason || "Cancelled by patient",
  );
}

// Complete appointment
export async function completeAppointment(
  appointmentId: string,
  userId?: string,
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
    `,
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
