import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const patientName = searchParams.get("patientName");
    const status = searchParams.get("status");

    console.log("🔍 [Prescription Search] Params:", { patientId, patientName, status });

    // Build the query
    let query = supabase
      .from("prescriptions")
      .select(
        `
        *,
        doctors!inner (
          doctor_id,
          first_name,
          last_name,
          specialization
        ),
        patients!inner (
          patient_id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `
      )
      .order("prescribed_date", { ascending: false });

    // Filter by patient ID
    if (patientId) {
      // First, get the UUID for this patient_id
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("patient_id", patientId)
        .single();

      if (patientError || !patientData) {
        console.log("⚠️ [Prescription Search] Patient not found:", patientId);
        return NextResponse.json({ prescriptions: [] });
      }

      console.log("✅ [Prescription Search] Found patient UUID:", patientData.id);
      query = query.eq("patient_id", patientData.id);
    }

    // Filter by patient name (search in the related patients table)
    if (patientName && !patientId) {
      // First get patients matching the name
      const { data: patients, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .or(
          `first_name.ilike.%${patientName}%,last_name.ilike.%${patientName}%`
        );

      if (patientError) {
        console.error("❌ [Prescription Search] Error searching patients:", patientError);
        return NextResponse.json(
          { error: "Failed to search patients" },
          { status: 500 }
        );
      }

      if (patients && patients.length > 0) {
        const patientUUIDs = patients.map((p) => p.id);
        console.log("✅ [Prescription Search] Found", patients.length, "matching patients");
        query = query.in("patient_id", patientUUIDs);
      } else {
        // No patients found with that name
        console.log("⚠️ [Prescription Search] No patients found with name:", patientName);
        return NextResponse.json({ prescriptions: [] });
      }
    }

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ [Prescription Search] Error:", error);
      return NextResponse.json(
        { error: `Failed to fetch prescriptions: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("✅ [Prescription Search] Found:", data?.length || 0, "prescriptions");

    // Transform the data to include doctor and patient details
    const prescriptions = (data || []).map((rx: any) => ({
      ...rx,
      patient_id: rx.patients?.patient_id || "", // Use the string patient_id, not UUID
      doctor_name: rx.doctors
        ? `Dr. ${rx.doctors.first_name} ${rx.doctors.last_name}`
        : "Unknown Doctor",
      doctor_specialization: rx.doctors?.specialization || "N/A",
      patient_name: rx.patients
        ? `${rx.patients.first_name} ${rx.patients.last_name}`
        : "Unknown Patient",
      patient_email: rx.patients?.email || "",
      patient_phone: rx.patients?.phone_number || "",
    }));

    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    console.error("❌ [Prescription Search] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

