import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import {
  createMedicalRecord,
  listMedicalRecords,
  updateMedicalRecord,
} from "@/lib/clinical/records";
import { clinicalError } from "@/lib/clinical/respond";

// Encrypted medical records: decrypted here for callers RLS allows.
export async function GET(request: NextRequest) {
  const auth = await guard();
  if (auth instanceof Response) return auth;
  const p = request.nextUrl.searchParams;
  try {
    const records = await listMedicalRecords(auth.supabase, {
      patientId: p.get("patientId") ?? undefined,
      id: p.get("id") ?? undefined,
      appointmentId: p.get("appointmentId") ?? undefined,
    });
    return NextResponse.json({ records });
  } catch (err) {
    return clinicalError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await guard("doctor");
  if (auth instanceof Response) return auth;
  try {
    const record = await createMedicalRecord(auth, await request.json());
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    return clinicalError(err);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await guard("doctor");
  if (auth instanceof Response) return auth;
  try {
    const { id, updates } = await request.json();
    const record = await updateMedicalRecord(auth, id, updates ?? {});
    return NextResponse.json({ record });
  } catch (err) {
    return clinicalError(err);
  }
}
