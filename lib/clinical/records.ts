import "server-only";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { keystore } from "@/lib/crypto/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { processEmbeddingJobs } from "@/lib/rag/indexer";
import { decryptRow, encryptRow, ENCRYPTED_FIELDS } from "@/lib/crypto/clinical";
import type { CurrentUser } from "@/lib/supabase/server";

// Server-side access to encrypted clinical records. All queries run as the
// signed-in user (RLS + audited read RPCs); this module only adds
// encryption on the way in and decryption on the way out.

const RECORD_EMBED = `*,
  doctors ( first_name, last_name, specialization ),
  appointments ( appointment_date, appointment_time ),
  patients ( first_name, last_name )`;

const RX_EMBED = `*,
  doctors ( first_name, last_name, specialization ),
  appointments ( appointment_date, appointment_time, is_telemedicine ),
  patients:patient_directory ( patient_id, first_name, last_name, email, phone_number )`;

// The write triggers enqueued a re-embedding job; drain it now so the
// assistant sees the change immediately. Failures stay queued for retry.
function reindexSoon() {
  processEmbeddingJobs(supabaseAdmin, keystore).catch((e) =>
    console.error("Re-embedding failed:", (e as Error).message),
  );
}

export class ClinicalError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// Only these keys are accepted from clients on write.
const RECORD_WRITABLE = new Set([
  "appointment_id", "patient_id", "record_date", "blood_pressure", "heart_rate",
  "temperature", "weight", "height", "lab_results", "test_results", "allergies",
  "current_medications", "past_medical_history", ...ENCRYPTED_FIELDS.medical_records,
]);
const RX_WRITABLE = new Set([
  "appointment_id", "patient_id", "frequency", "duration", "prescribed_date",
  "start_date", "end_date", "status", ...ENCRYPTED_FIELDS.prescriptions,
]);

function pick(input: Record<string, unknown>, allowed: Set<string>) {
  return Object.fromEntries(Object.entries(input).filter(([k]) => allowed.has(k)));
}

async function patientOf(
  sb: SupabaseClient,
  table: "appointments" | "medical_records" | "prescriptions",
  id: string,
): Promise<string> {
  const { data } = await sb.from(table).select("patient_id").eq("id", id).maybeSingle();
  if (!data) throw new ClinicalError("Not found or access denied", 404);
  return data.patient_id as string;
}

// ---------------------------------------------------------------------------
// Medical records
// ---------------------------------------------------------------------------

export async function listMedicalRecords(
  sb: SupabaseClient,
  q: { patientId?: string; id?: string; appointmentId?: string },
) {
  const patientId =
    q.patientId ??
    (q.id ? await patientOf(sb, "medical_records", q.id) : undefined) ??
    (q.appointmentId ? await patientOf(sb, "appointments", q.appointmentId) : undefined);
  if (!patientId) throw new ClinicalError("patientId, id or appointmentId is required");

  let query = sb.rpc("read_medical_records", { p_patient_id: patientId }).select(RECORD_EMBED);
  if (q.id) query = query.eq("id", q.id);
  if (q.appointmentId) query = query.eq("appointment_id", q.appointmentId);
  const { data, error } = await query;
  if (error) throw new ClinicalError(error.message, 500);
  return Promise.all((data ?? []).map((r: any) => decryptRow(keystore, "medical_records", r)));
}

export async function createMedicalRecord(user: CurrentUser, input: Record<string, unknown>) {
  const id = crypto.randomUUID();
  const row = await encryptRow(keystore, "medical_records", id, {
    ...pick(input, RECORD_WRITABLE),
    doctor_id: user.profileId,
  });
  // Insert as the doctor: RLS checks they treat this patient.
  const { error } = await user.supabase.from("medical_records").insert(row);
  if (error) throw new ClinicalError("Could not create medical record", 403);

  await user.supabase.from("medical_record_logs").insert({
    medical_record_id: id,
    action_type: "created",
    performed_by_user_id: user.profileId,
    performed_by_role: user.role,
    metadata: { appointment_id: input.appointment_id ?? null },
  });
  reindexSoon();
  const [created] = await listMedicalRecords(user.supabase, { id });
  return created;
}

export async function updateMedicalRecord(
  user: CurrentUser,
  id: string,
  updates: Record<string, unknown>,
) {
  const [current] = await listMedicalRecords(user.supabase, { id });
  if (!current) throw new ClinicalError("Not found or access denied", 404);
  const changes = pick(updates, RECORD_WRITABLE);

  const merged: Record<string, unknown> = {};
  for (const k of RECORD_WRITABLE) merged[k] = k in changes ? changes[k] : (current as any)[k];
  // Fresh DEK on every write.
  const row = await encryptRow(keystore, "medical_records", id, merged);
  delete row.id;
  delete row.patient_id;

  const { data, error } = await user.supabase
    .from("medical_records")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) throw new ClinicalError("Could not update medical record", 403);

  await user.supabase.from("medical_record_logs").insert({
    medical_record_id: id,
    action_type: "updated",
    performed_by_user_id: user.profileId,
    performed_by_role: user.role,
    metadata: { changed_fields: Object.keys(changes) },
  });
  reindexSoon();
  const [updated] = await listMedicalRecords(user.supabase, { id });
  return updated;
}

// ---------------------------------------------------------------------------
// Prescriptions
// ---------------------------------------------------------------------------

export async function listPrescriptions(
  sb: SupabaseClient,
  q: { patientId?: string; appointmentId?: string; id?: string; status?: string },
) {
  const patientId =
    q.patientId ??
    (q.id ? await patientOf(sb, "prescriptions", q.id) : undefined) ??
    (q.appointmentId ? await patientOf(sb, "appointments", q.appointmentId) : undefined);
  if (!patientId) throw new ClinicalError("patientId, id or appointmentId is required");

  let query = sb.rpc("read_prescriptions", { p_patient_id: patientId }).select(RX_EMBED);
  if (q.id) query = query.eq("id", q.id);
  if (q.appointmentId) query = query.eq("appointment_id", q.appointmentId);
  if (q.status && q.status !== "all") query = query.eq("status", q.status);
  const { data, error } = await query;
  if (error) throw new ClinicalError(error.message, 500);
  return Promise.all((data ?? []).map((r: any) => decryptRow(keystore, "prescriptions", r)));
}

export async function createPrescription(user: CurrentUser, input: Record<string, unknown>) {
  const id = crypto.randomUUID();
  const row = await encryptRow(keystore, "prescriptions", id, {
    ...pick(input, RX_WRITABLE),
    doctor_id: user.profileId,
  });
  const { error } = await user.supabase.from("prescriptions").insert(row);
  if (error) throw new ClinicalError("Could not create prescription", 403);

  await user.supabase.from("prescription_logs").insert({
    prescription_id: id,
    action_type: "created",
    performed_by_user_id: user.profileId,
    performed_by_role: user.role,
    metadata: { appointment_id: input.appointment_id ?? null },
  });
  reindexSoon();
  const [created] = await listPrescriptions(user.supabase, { id });
  return created;
}

/** Status change by the prescriber, or dispensing by pharmacy staff. */
export async function updatePrescription(
  user: CurrentUser,
  id: string,
  change: { status?: string; notes?: string; dispense?: boolean },
) {
  const [current] = await listPrescriptions(user.supabase, { id });
  if (!current) throw new ClinicalError("Not found or access denied", 404);

  const status = change.dispense ? "completed" : change.status;
  if (status && !["active", "completed", "discontinued"].includes(status)) {
    throw new ClinicalError("Invalid status");
  }
  let notes = (current as any).notes as string | null;
  if (change.notes) {
    notes = change.dispense
      ? notes ? `${notes}\n[Pharmacy] ${change.notes}` : `[Pharmacy] ${change.notes}`
      : change.notes;
  }

  const fields: Record<string, unknown> = {};
  for (const f of ENCRYPTED_FIELDS.prescriptions) fields[f] = (current as any)[f];
  fields.notes = notes;
  const row = await encryptRow(keystore, "prescriptions", id, fields);
  delete row.id;

  const { data, error } = await user.supabase
    .from("prescriptions")
    .update({ ...row, ...(status ? { status } : {}), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) throw new ClinicalError("Could not update prescription", 403);

  await user.supabase.from("prescription_logs").insert({
    prescription_id: id,
    action_type: status === "discontinued" ? "discontinued" : "updated",
    performed_by_user_id: user.profileId,
    performed_by_role: user.role,
    metadata: { status: status ?? null, dispensed: !!change.dispense, notes_changed: !!change.notes },
  });
  reindexSoon();
}
