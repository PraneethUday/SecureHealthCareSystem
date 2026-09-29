/**
 * @jest-environment node
 */

/**
 * Epic 2: Patient Medical Record Management
 *
 * Exercises the server-side clinical module (lib/clinical/records) with the
 * real envelope encryption and a mocked database, to show that:
 *   - what a doctor writes reaches the database only as ciphertext
 *   - the change log records which fields changed, never their values
 *   - reads decrypt for the caller
 *   - a write refused by RLS surfaces as a 403
 */

import crypto from "crypto";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/rag/indexer", () => ({ processEmbeddingJobs: jest.fn().mockResolvedValue({}) }));
jest.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: {} }));

const KEK = crypto.randomBytes(32);
jest.mock("@/lib/crypto/server", () => {
  const { Keystore } = jest.requireActual("@/lib/crypto/clinical");
  const ks = new Keystore({} as any);
  ks.kek = async () => KEK;
  ks.currentVersion = async () => 1;
  return { keystore: ks };
});

import { createMedicalRecord, listMedicalRecords, ClinicalError } from "@/lib/clinical/records";

// In-memory "database" standing in for the doctor's RLS-scoped client.
function doctorClient(opts: { refuseInsert?: boolean } = {}) {
  const tables: Record<string, any[]> = { medical_records: [], medical_record_logs: [] };
  const client: any = {
    tables,
    from: (table: string) => ({
      insert: async (row: any) => {
        if (opts.refuseInsert && table === "medical_records") {
          return { error: { message: "new row violates row-level security policy" } };
        }
        tables[table].push(row);
        return { error: null };
      },
      select: () => ({
        eq: (_: string, id: string) => ({
          maybeSingle: async () => ({
            data: tables.medical_records.find((r) => r.id === id) ?? null,
          }),
        }),
      }),
    }),
    rpc: (_fn: string, { p_patient_id }: any) => {
      const rows = tables.medical_records.filter((r) => r.patient_id === p_patient_id);
      const q: any = {
        select: () => q,
        eq: (col: string, v: string) => {
          q.rows = (q.rows ?? rows).filter((r: any) => r[col] === v);
          return q;
        },
        then: (resolve: any) => resolve({ data: q.rows ?? rows, error: null }),
      };
      return q;
    },
  };
  return client;
}

const doctor = (supabase: any) =>
  ({ role: "doctor", profileId: "doctor-uuid", businessId: "D001", aal: "aal2", supabase }) as any;

const newRecord = {
  appointment_id: "appt123",
  patient_id: "patient-uuid",
  record_date: "2026-03-10",
  chief_complaint: "Headache",
  diagnosis: "Tension-type headache",
  treatment_plan: "Rest and hydration",
  notes: "Call 9876543101 if worse",
};

describe("Epic 2: Patient Medical Record Management", () => {
  describe("TC-MR-001: Doctor creates a medical record", () => {
    it("stores only ciphertext for clinical fields", async () => {
      const db = doctorClient();
      await createMedicalRecord(doctor(db), newRecord);

      const [row] = db.tables.medical_records;
      for (const f of ["chief_complaint", "diagnosis", "treatment_plan", "notes"]) {
        expect(row[f]).toBeNull();
      }
      expect(row.doctor_id).toBe("doctor-uuid"); // from the session, not the client
      expect(row.phi_ciphertext).toMatch(/^\\x[0-9a-f]+$/);
      expect(row.encrypted_dek).toMatch(/^\\x[0-9a-f]+$/);
      expect(JSON.stringify(row)).not.toMatch(/headache|hydration|9876543101/i);
    });

    it("logs the creation without copying clinical values", async () => {
      const db = doctorClient();
      await createMedicalRecord(doctor(db), newRecord);
      const [log] = db.tables.medical_record_logs;
      expect(log).toMatchObject({ action_type: "created", performed_by_user_id: "doctor-uuid" });
      expect(log.old_data).toBeUndefined();
      expect(log.new_data).toBeUndefined();
    });

    it("ignores fields a client should not set", async () => {
      const db = doctorClient();
      await createMedicalRecord(doctor(db), { ...newRecord, doctor_id: "someone-else", key_version: 99 } as any);
      const [row] = db.tables.medical_records;
      expect(row.doctor_id).toBe("doctor-uuid");
      expect(row.key_version).toBe(1);
    });

    it("surfaces an RLS refusal as 403", async () => {
      const db = doctorClient({ refuseInsert: true });
      await expect(createMedicalRecord(doctor(db), newRecord)).rejects.toMatchObject({
        status: 403,
      });
      await expect(createMedicalRecord(doctor(db), newRecord)).rejects.toBeInstanceOf(ClinicalError);
    });
  });

  describe("TC-MR-002: Reading records", () => {
    it("decrypts records for the caller", async () => {
      const db = doctorClient();
      await createMedicalRecord(doctor(db), newRecord);
      const records = await listMedicalRecords(db, { patientId: "patient-uuid" });
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        diagnosis: "Tension-type headache",
        notes: "Call 9876543101 if worse",
      });
      expect(records[0]).not.toHaveProperty("phi_ciphertext");
    });

    it("never returns ciphertext when a row fails authentication", async () => {
      const db = doctorClient();
      await createMedicalRecord(doctor(db), newRecord);
      const row = db.tables.medical_records[0];
      row.phi_auth_tag = "\\x" + "00".repeat(16);
      const [rec] = await listMedicalRecords(db, { patientId: "patient-uuid" });
      expect(rec.diagnosis).toBeNull();
      expect(rec.decryption_failed).toBe(true);
    });
  });
});
