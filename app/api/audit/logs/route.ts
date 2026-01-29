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
    // 0. Resolve Patient UUID and Readable ID safely
    // P005 is not a UUID, so querying id.eq.P005 throws error. We must be specific.

    let pUuid = patientId;
    let pReadable = patientId;

    if (patientId) {
      // A. Try finding by Readable ID (patient_id column)
      const { data: byReadable } = await supabase
        .from("patients")
        .select("id, patient_id")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (byReadable) {
        pUuid = byReadable.id;
        pReadable = byReadable.patient_id;
      } else {
        // B. If not found, and it looks like a UUID, try ID column
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
        if (isUUID) {
          const { data: byUUID } = await supabase
            .from("patients")
            .select("id, patient_id")
            .eq("id", patientId)
            .maybeSingle();

          if (byUUID) {
            pUuid = byUUID.id;
            pReadable = byUUID.patient_id;
          }
        }
      }
    }

    // Helper to get IDs from related tables (using established IDs)
    const fetchIds = async (table: string) => {
      if (!pUuid) return [];
      // Query primarily by UUID since most foreign keys use it, but check pReadable if schema differs
      const { data } = await supabase
        .from(table)
        .select("id")
        .or(`patient_id.eq.${pUuid},patient_id.eq.${pReadable}`);
      return data?.map((d: any) => d.id) || [];
    };

    const recordIds = await fetchIds("medical_records");
    const prescriptionIds = await fetchIds("prescriptions");
    const reportIds = await fetchIds("medical_reports");

    // 3. Build list of all related resource IDs
    const relatedIds = [
      patientId,
      pUuid,      // Add UUID explicitly
      pReadable,  // Add P-ID explicitly
      ...recordIds,
      ...prescriptionIds,
      ...reportIds
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
