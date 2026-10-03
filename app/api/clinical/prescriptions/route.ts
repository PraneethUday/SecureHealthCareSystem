import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import {
  createPrescription,
  listPrescriptions,
  updatePrescription,
} from "@/lib/clinical/records";
import { clinicalError } from "@/lib/clinical/respond";

// Encrypted prescriptions: decrypted here for callers RLS allows.
export async function GET(request: NextRequest) {
  const auth = await guard();
  if (auth instanceof Response) return auth;
  const p = request.nextUrl.searchParams;
  try {
    const prescriptions = await listPrescriptions(auth.supabase, {
      patientId: p.get("patientId") ?? undefined,
      appointmentId: p.get("appointmentId") ?? undefined,
      id: p.get("id") ?? undefined,
      status: p.get("status") ?? undefined,
    });
    return NextResponse.json({ prescriptions });
  } catch (err) {
    return clinicalError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await guard("doctor");
  if (auth instanceof Response) return auth;
  try {
    const prescription = await createPrescription(auth, await request.json());
    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err) {
    return clinicalError(err);
  }
}

// Doctors change status; pharmacy staff dispense ({ dispense: true }).
export async function PATCH(request: NextRequest) {
  const auth = await guard("doctor", "staff");
  if (auth instanceof Response) return auth;
  try {
    const { id, status, notes, dispense } = await request.json();
    if (auth.role === "staff" && (status || !dispense)) {
      return NextResponse.json({ error: "Pharmacy staff can only dispense" }, { status: 403 });
    }
    await updatePrescription(auth, id, { status, notes, dispense: !!dispense });
    return NextResponse.json({ success: true });
  } catch (err) {
    return clinicalError(err);
  }
}
