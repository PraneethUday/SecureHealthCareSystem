import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import { listPrescriptions } from "@/lib/clinical/records";
import { clinicalError } from "@/lib/clinical/respond";

// Pharmacy search. RLS limits patients to those the caller serves; the
// prescriptions come back decrypted through the audited read path.
export async function GET(request: NextRequest) {
  const auth = await guard("staff", "doctor", "nurse");
  if (auth instanceof Response) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const patientCode = searchParams.get("patientId");
    // Strip PostgREST filter syntax so input can't add conditions to .or().
    const patientName = searchParams
      .get("patientName")
      ?.replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim();
    const status = searchParams.get("status") ?? undefined;

    let patients = auth.supabase.from("patients").select("id").limit(25);
    if (patientCode) {
      patients = patients.eq("patient_id", patientCode);
    } else if (patientName) {
      patients = patients.or(`first_name.ilike.%${patientName}%,last_name.ilike.%${patientName}%`);
    } else {
      return NextResponse.json({ prescriptions: [] });
    }

    const { data: matches, error } = await patients;
    if (error) {
      return NextResponse.json({ error: "Failed to search patients" }, { status: 500 });
    }

    const lists = await Promise.all(
      (matches ?? []).map((p) => listPrescriptions(auth.supabase, { patientId: p.id, status })),
    );

    const prescriptions = lists.flat().map((rx: any) => ({
      ...rx,
      patient_id: rx.patients?.patient_id || "",
      doctor_name: rx.doctors ? `Dr. ${rx.doctors.first_name} ${rx.doctors.last_name}` : "Unknown Doctor",
      doctor_specialization: rx.doctors?.specialization || "N/A",
      patient_name: rx.patients ? `${rx.patients.first_name} ${rx.patients.last_name}` : "Unknown Patient",
      patient_email: rx.patients?.email || "",
      patient_phone: rx.patients?.phone_number || "",
    }));

    return NextResponse.json({ prescriptions });
  } catch (err) {
    return clinicalError(err);
  }
}
