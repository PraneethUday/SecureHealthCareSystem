import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, patientId } = body;

    if (!appointmentId || !patientId) {
      return NextResponse.json(
        { error: "Missing appointmentId or patientId" },
        { status: 400 },
      );
    }

    // Verify the appointment belongs to the patient
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, doctors(first_name, last_name)")
      .eq("id", appointmentId)
      .eq("patient_id", patientId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found or access denied" },
        { status: 404 },
      );
    }

    // Update the appointment to grant access
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ share_health_profile: true })
      .eq("id", appointmentId);

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

    // Create notification
    await supabase.from("notifications").insert({
      recipient_id: appointment.doctor_id,
      recipient_role: "doctor",
      title: "Access Granted",
      message: `${patientName} has granted you access to their health records.`,
      type: "access_granted",
      related_entity_type: "appointment",
      related_entity_id: appointmentId,
      metadata: { patientId, patientName },
    });

    // Log the action
    await supabase.from("access_logs").insert({
      patient_id: patientId,
      accessed_by_id: patientId,
      accessed_by_role: "patient",
      action_type: "access_granted",
      resource_type: "health_profile",
      metadata: {
        appointmentId,
        doctorId: appointment.doctor_id,
        doctorName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Access granted to Dr. ${doctorName}`,
    });
  } catch (error) {
    console.error("Error in grant-access POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
