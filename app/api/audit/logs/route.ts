import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const patientId = searchParams.get("patientId");

  let query = supabase
    .from("access_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (patientId) {
    // 1. Get all medical record IDs for this patient
    const { data: records } = await supabase
      .from("medical_records")
      .select("id")
      .eq("patient_id", patientId);

    // 2. Get all prescription IDs for this patient
    const { data: prescriptions } = await supabase
      .from("prescriptions")
      .select("id")
      .eq("patient_id", patientId);

    // 3. Build list of all related resource IDs
    const relatedIds = [
      patientId, // Direct access to patient profile/list
      ...(records?.map(r => r.id) || []),
      ...(prescriptions?.map(p => p.id) || [])
    ];

    // 4. Filter logs
    query = query.in("resource_id", relatedIds);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
