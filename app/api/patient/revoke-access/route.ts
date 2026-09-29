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
    const { appointmentId, doctorId } = body;

    if (!appointmentId && !doctorId) {
      return NextResponse.json(
        { error: "Missing appointmentId or doctorId" },
        { status: 400 },
      );
    }

    if (doctorId) {
      // Revoke access for ALL appointments this patient has with this doctor
      const { data: appointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id, doctor_id, doctors(first_name, last_name)")
        .eq("patient_id", patientId)
        .eq("doctor_id", doctorId)
        .eq("share_health_profile", true);

      if (fetchError) {
        return NextResponse.json(
          { error: "Failed to find appointments" },
          { status: 500 },
        );
      }

      if (!appointments || appointments.length === 0) {
        return NextResponse.json(
          { error: "No active access found for this doctor" },
          { status: 404 },
        );
      }

      const ids = appointments.map((a: any) => a.id);
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ share_health_profile: false, access_expires_at: null })
        .in("id", ids);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to revoke access" },
          { status: 500 },
        );
      }

      const doctorData = (appointments[0] as any).doctors as any;
      const doctorName = doctorData
        ? `${doctorData.first_name} ${doctorData.last_name}`
        : "Doctor";

      const { data: patientData } = await supabase
        .from("patients")
        .select("first_name, last_name")
        .eq("id", patientId)
        .single();

      const patientName = patientData
        ? `${patientData.first_name} ${patientData.last_name}`
        : "Patient";

      await supabase.from("notifications").insert({
        recipient_id: doctorId,
        recipient_role: "doctor",
        title: "Access Revoked",
        message: `${patientName} has revoked your access to their health records.`,
        type: "access_revoked",
        related_entity_type: "appointment",
        related_entity_id: ids[0],
        metadata: { patientId, patientName },
      });

      await logAction({
        userId: auth.businessId,
        userRole: "patient",
        action: "access_revoked",
        resourceType: "health_profile",
        resourceId: patientId,
        details: JSON.stringify({ doctorId, doctorName, appointmentIds: ids }),
        status: "success",
      });

      return NextResponse.json({
        success: true,
        message: `Access revoked for Dr. ${doctorName}`,
      });
    }

    // Single appointment revoke
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

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ share_health_profile: false, access_expires_at: null })
      .eq("id", appointmentId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to revoke access" },
        { status: 500 },
      );
    }

    const doctorData = appointment.doctors as any;
    const doctorName = doctorData
      ? `${doctorData.first_name} ${doctorData.last_name}`
      : "Doctor";

    const { data: patientData } = await supabase
      .from("patients")
      .select("first_name, last_name")
      .eq("id", patientId)
      .single();

    const patientName = patientData
      ? `${patientData.first_name} ${patientData.last_name}`
      : "Patient";

    await supabase.from("notifications").insert({
      recipient_id: appointment.doctor_id,
      recipient_role: "doctor",
      title: "Access Revoked",
      message: `${patientName} has revoked your access to their health records.`,
      type: "access_revoked",
      related_entity_type: "appointment",
      related_entity_id: appointmentId,
      metadata: { patientId, patientName },
    });

    await logAction({
      userId: auth.businessId,
      userRole: "patient",
      action: "access_revoked",
      resourceType: "health_profile",
      resourceId: patientId,
      details: JSON.stringify({
        appointmentId,
        doctorId: appointment.doctor_id,
        doctorName,
      }),
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Access revoked for Dr. ${doctorName}`,
    });
  } catch (error) {
    console.error("Error in revoke-access POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
