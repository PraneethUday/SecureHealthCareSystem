import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import { logAction } from "@/lib/logging";

export async function POST(request: NextRequest) {
  try {
    const auth = await guard("patient");
    if (auth instanceof Response) return auth;
    const supabase = auth.supabase;
    // A patient can only grant or revoke access to their own record.
    const patientId = auth.profileId;

    const body = await request.json();
    const { appointmentId, doctorId, expiresAt } = body;

    if (!appointmentId && !doctorId) {
      return NextResponse.json(
        { error: "Missing appointmentId or doctorId" },
        { status: 400 },
      );
    }

    let appointment: any;

    if (doctorId) {
      // Grant access for the most recent upcoming/scheduled appointment with this doctor
      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select("id, patient_id, doctor_id, doctors(first_name, last_name)")
        .eq("patient_id", patientId)
        .eq("doctor_id", doctorId)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !data) {
        return NextResponse.json(
          { error: "No upcoming appointment found for this doctor" },
          { status: 404 },
        );
      }
      appointment = data;
    } else {
      // Grant for specific appointment
      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select("id, patient_id, doctor_id, doctors(first_name, last_name)")
        .eq("id", appointmentId)
        .eq("patient_id", patientId)
        .single();

      if (fetchError || !data) {
        return NextResponse.json(
          { error: "Appointment not found or access denied" },
          { status: 404 },
        );
      }
      appointment = data;
    }

    // Validate expiresAt is in the future if provided
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: "Expiry time must be in the future" },
        { status: 400 },
      );
    }

    // Update the appointment to grant access (with optional expiry)
    const updatePayload: Record<string, unknown> = {
      share_health_profile: true,
    };
    if (expiresAt) {
      updatePayload.access_expires_at = expiresAt;
    } else {
      updatePayload.access_expires_at = null;
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointment.id);

    if (updateError) {
      console.error("Error granting access:", updateError);
      return NextResponse.json(
        { error: "Failed to grant access" },
        { status: 500 },
      );
    }

    // Create notification for the doctor
    const doctorData = appointment.doctors as any;
    const doctorName = doctorData
      ? `${doctorData.first_name} ${doctorData.last_name}`
      : "Doctor";

    // Get patient name for notification
    const { data: patientData } = await supabase
      .from("patients")
      .select("first_name, last_name")
      .eq("id", patientId)
      .single();

    const patientName = patientData
      ? `${patientData.first_name} ${patientData.last_name}`
      : "Patient";

    const expiryNote = expiresAt
      ? ` (expires ${new Date(expiresAt).toLocaleDateString()})`
      : "";

    // Create notification
    await supabase.from("notifications").insert({
      recipient_id: appointment.doctor_id,
      recipient_role: "doctor",
      title: "Access Granted",
      message: `${patientName} has granted you access to their health records${expiryNote}.`,
      type: "access_granted",
      related_entity_type: "appointment",
      related_entity_id: appointment.id,
      metadata: { patientId, patientName, expiresAt: expiresAt || null },
    });

    // Log the action
    await logAction({
      userId: auth.businessId,
      userRole: "patient",
      action: "access_granted",
      resourceType: "health_profile",
      resourceId: patientId,
      details: JSON.stringify({
        appointmentId: appointment.id,
        doctorId: appointment.doctor_id,
        doctorName,
        expiresAt: expiresAt || null,
      }),
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Access granted to Dr. ${doctorName}${expiryNote}`,
    });
  } catch (error) {
    console.error("Error in grant-access POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
