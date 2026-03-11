import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
    }

    // Get all appointments for this patient
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        doctor_id,
        appointment_date,
        share_health_profile,
        access_expires_at,
        status,
        doctors (
          first_name,
          last_name
        ),
        hospitals (
          name
        )
      `,
      )
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("Error fetching access records:", error);
      return NextResponse.json(
        { error: "Failed to fetch access records" },
        { status: 500 },
      );
    }

    const now = new Date();
    const completedStatuses = ["completed", "cancelled", "no_show"];

    // Auto-revoke access for appointments that are over or whose time period has expired
    const toRevoke = (appointments || []).filter((apt: any) => {
      if (!apt.share_health_profile) return false;
      const appointmentEnded = completedStatuses.includes(apt.status);
      const accessExpired =
        apt.access_expires_at && new Date(apt.access_expires_at) < now;
      return appointmentEnded || accessExpired;
    });

    if (toRevoke.length > 0) {
      const idsToRevoke = toRevoke.map((apt: any) => apt.id);
      await supabase
        .from("appointments")
        .update({ share_health_profile: false, access_expires_at: null })
        .in("id", idsToRevoke);

      // Mark them as revoked in local data so the response is accurate
      toRevoke.forEach((apt: any) => {
        apt.share_health_profile = false;
        apt.access_expires_at = null;
      });
    }

    // Transform to access records format
    const records = (appointments || []).map((apt: any) => ({
      id: apt.id,
      doctorId: apt.doctor_id,
      doctorName: apt.doctors
        ? `${apt.doctors.first_name} ${apt.doctors.last_name}`
        : "Unknown Doctor",
      hospitalName: apt.hospitals?.name || "Unknown Hospital",
      appointmentDate: apt.appointment_date,
      shareHealthProfile: apt.share_health_profile || false,
      accessExpiresAt: apt.access_expires_at || null,
      status: apt.share_health_profile ? "active" : "revoked",
      appointmentStatus: apt.status,
    }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error in access-records GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
