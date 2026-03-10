import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
    }

    // Get all appointments that have share_health_profile set (either true or false from previously sharing)
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        doctor_id,
        appointment_date,
        share_health_profile,
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

    // Transform the data into access records format
    const records = (appointments || []).map((apt: any) => ({
      id: apt.id,
      doctorId: apt.doctor_id,
      doctorName: apt.doctors
        ? `${apt.doctors.first_name} ${apt.doctors.last_name}`
        : "Unknown Doctor",
      hospitalName: apt.hospitals?.name || "Unknown Hospital",
      appointmentDate: apt.appointment_date,
      shareHealthProfile: apt.share_health_profile || false,
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
