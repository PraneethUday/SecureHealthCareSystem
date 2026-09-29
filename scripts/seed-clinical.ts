/**
 * Encrypted clinical fixtures for local development and the access-control
 * tests (see supabase/seeds/03_clinical_fixtures.sql for the care
 * relationships). Written through the same envelope encryption the app
 * uses, since the database rejects plaintext in these columns.
 *
 *   npm run seed:clinical
 */
import { adminClient } from "./lib/admin-client";
import { encryptRow, Keystore } from "../lib/crypto/clinical";

const admin = adminClient();
const keystore = new Keystore(admin);

async function id(table: string, col: string, value: string) {
  const { data } = await admin.from(table).select("id").eq(col, value).single();
  return data!.id as string;
}

async function main() {
  const [p1, p2, d1, d4] = await Promise.all([
    id("patients", "patient_id", "P001"),
    id("patients", "patient_id", "P002"),
    id("doctors", "doctor_id", "D001"),
    id("doctors", "doctor_id", "D004"),
  ]);

  const records = [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      appointment_id: "a0000000-0000-0000-0000-000000000001",
      patient_id: p1, doctor_id: d1,
      chief_complaint: "Chest pain on exertion",
      diagnosis: "Stable angina pectoris",
      symptoms: "Retrosternal tightness climbing stairs, relieved by rest",
      treatment_plan: "Start aspirin and a beta blocker; stress ECG in 2 weeks",
      notes: "Patient reports family history of CAD. Contact on 9876543101 for ECG slot.",
    },
    {
      id: "b0000000-0000-0000-0000-000000000002",
      appointment_id: "a0000000-0000-0000-0000-000000000002",
      patient_id: p2, doctor_id: d4,
      chief_complaint: "Knee pain after fall",
      diagnosis: "Grade II medial collateral ligament sprain",
      symptoms: "Swelling and medial joint-line tenderness, stable to varus stress",
      treatment_plan: "Hinged knee brace, physiotherapy 3x weekly, review in 3 weeks",
      notes: "Allergic to penicillin - avoid in any post-op antibiotic plan.",
    },
  ];

  const prescriptions = [
    { id: "c0000000-0000-0000-0000-000000000001", appointment_id: records[0].appointment_id, patient_id: p1, doctor_id: d1,
      medication_name: "Aspirin", dosage: "75 mg", frequency: "Once daily", duration: "90 days", instructions: "Take after breakfast" },
    { id: "c0000000-0000-0000-0000-000000000002", appointment_id: records[0].appointment_id, patient_id: p1, doctor_id: d1,
      medication_name: "Metoprolol", dosage: "25 mg", frequency: "Twice daily", duration: "90 days", instructions: "Hold if pulse below 55" },
    { id: "c0000000-0000-0000-0000-000000000003", appointment_id: records[1].appointment_id, patient_id: p2, doctor_id: d4,
      medication_name: "Ibuprofen", dosage: "400 mg", frequency: "Three times daily", duration: "7 days", instructions: "Take with food" },
  ];

  for (const r of records) {
    const row = await encryptRow(keystore, "medical_records", r.id, r);
    const { error } = await admin.from("medical_records").upsert(row);
    if (error) throw error;
  }
  for (const p of prescriptions) {
    const row = await encryptRow(keystore, "prescriptions", p.id, p);
    const { error } = await admin.from("prescriptions").upsert(row);
    if (error) throw error;
  }
  console.log(`Seeded ${records.length} medical records and ${prescriptions.length} prescriptions (encrypted).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
