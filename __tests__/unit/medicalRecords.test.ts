/**
 * Unit Tests for lib/medicalRecords.ts
 * Tests medical record management functions
 */

import {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  logMedicalRecordDownload,
  getMedicalRecordLogs,
  hasAppointmentMedicalRecord,
} from "@/lib/medicalRecords";
import { mockFetchOnce, lastFetch } from "../helpers/mockFetch";

global.fetch = jest.fn();

// Mock supabase
const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
};

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseChain),
  },
}));

// Mock logging
jest.mock("@/lib/logging", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

describe("Medical Records Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockSupabaseChain).forEach((fn) => {
      if (typeof fn === "function" && fn.mockReturnThis) {
        fn.mockReturnThis();
      }
    });
  });

  // Clinical fields are encrypted at rest, so these functions go through
  // the server (/api/clinical/medical-records) rather than Supabase.
  describe("createMedicalRecord()", () => {
    it("POSTs the record to the encrypting API and returns it", async () => {
      mockFetchOnce({ record: { id: "rec123", diagnosis: "Common cold" } }, 201);
      const result = await createMedicalRecord(
        {
          appointment_id: "apt123",
          patient_id: "patient123",
          doctor_id: "doctor123",
          record_date: "2026-01-15",
          chief_complaint: "Cough and cold",
          diagnosis: "Common cold",
          treatment_plan: "Rest and fluids",
        } as any,
        "doctor123",
      );
      expect(result).toEqual({ success: true, data: { id: "rec123", diagnosis: "Common cold" } });
      const call = lastFetch();
      expect(call.url).toBe("/api/clinical/medical-records");
      expect(call.method).toBe("POST");
      expect(call.body.diagnosis).toBe("Common cold");
    });

    it("surfaces the server's error message", async () => {
      mockFetchOnce({ error: "Could not create medical record" }, 403);
      const result = await createMedicalRecord({ patient_id: "p" } as any, "d");
      expect(result).toEqual({ success: false, error: "Could not create medical record" });
    });
  });

  describe("getPatientMedicalRecords()", () => {
    it("fetches decrypted records for the patient and adds display fields", async () => {
      mockFetchOnce({
        records: [
          {
            id: "rec1",
            diagnosis: "Flu",
            doctors: { first_name: "John", last_name: "Doe", specialization: "GP" },
            appointments: { appointment_date: "2026-01-15", appointment_time: "10:00" },
          },
        ],
      });
      const records = await getPatientMedicalRecords("patient123");
      expect(lastFetch().url).toBe("/api/clinical/medical-records?patientId=patient123");
      expect(records[0]).toMatchObject({
        diagnosis: "Flu",
        doctor_name: "John Doe",
        doctor_specialization: "GP",
        appointment_date: "2026-01-15",
      });
    });

    it("returns an empty list when the request fails", async () => {
      mockFetchOnce({ error: "denied" }, 403);
      expect(await getPatientMedicalRecords("patient123")).toEqual([]);
    });
  });

  describe("getMedicalRecordById()", () => {
    it("returns the record by ID", async () => {
      mockFetchOnce({ records: [{ id: "rec123", diagnosis: "Flu", patients: { first_name: "A", last_name: "B" } }] });
      const result = await getMedicalRecordById("rec123", "user1");
      expect(lastFetch().url).toBe("/api/clinical/medical-records?id=rec123");
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ id: "rec123", patient_name: "A B" });
    });

    it("reports not found when RLS hides the record", async () => {
      mockFetchOnce({ records: [] });
      expect(await getMedicalRecordById("rec999", "user1")).toEqual({
        success: false,
        error: "Record not found",
      });
    });
  });

  describe("updateMedicalRecord()", () => {
    it("PATCHes only the updates to the encrypting API", async () => {
      mockFetchOnce({ record: { id: "rec123", diagnosis: "Updated", treatment_plan: "New plan" } });
      const result = await updateMedicalRecord(
        "rec123",
        { diagnosis: "Updated", treatment_plan: "New plan" },
        "doctor123",
      );
      expect(result.success).toBe(true);
      expect(lastFetch()).toEqual({
        url: "/api/clinical/medical-records",
        method: "PATCH",
        body: { id: "rec123", updates: { diagnosis: "Updated", treatment_plan: "New plan" } },
      });
    });

    it("returns the error when the update is refused", async () => {
      mockFetchOnce({ error: "Could not update medical record" }, 403);
      const result = await updateMedicalRecord("rec123", { diagnosis: "x" }, "doctor123");
      expect(result.success).toBe(false);
    });
  });

  describe("logMedicalRecordDownload()", () => {
    it("should log download action", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: "log123" },
        error: null,
      });

      await logMedicalRecordDownload("rec123", "user123", "patient");

      expect(mockSupabaseChain.insert).toHaveBeenCalled();
    });

    it("should not throw on logging error", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      // Should not throw
      await expect(
        logMedicalRecordDownload("rec123", "user123", "doctor"),
      ).resolves.toBeUndefined();
    });
  });

  describe("getMedicalRecordLogs()", () => {
    it("should fetch medical record logs", async () => {
      const mockLogs = [
        { id: "1", action_type: "created" },
        { id: "2", action_type: "viewed" },
      ];
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: mockLogs,
        error: null,
      });

      const result = await getMedicalRecordLogs();

      expect(Array.isArray(result)).toBe(true);
    });


  });

  describe("hasAppointmentMedicalRecord()", () => {

  });
});
