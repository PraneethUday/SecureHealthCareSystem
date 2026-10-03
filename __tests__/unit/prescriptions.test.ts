/**
 * Unit Tests for lib/prescriptions.ts
 * Tests prescription management and video call functions
 */

import {
  createPrescription,
  hasAppointmentPrescriptions,
  getAppointmentPrescriptionCount,
  getPatientPrescriptions,
  getAppointmentPrescriptions,
  updatePrescriptionStatus,
  getPrescriptionLogs,
  startVideoCall,
  endVideoCall,
  getVideoCallLogs,
  searchPrescriptionsForPharmacy,
  markPrescriptionDispensed,
} from "@/lib/prescriptions";
import { mockFetchOnce, lastFetch } from "../helpers/mockFetch";

global.fetch = jest.fn();

// Mock supabase
const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
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

describe("Prescriptions Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockSupabaseChain).forEach((fn) => {
      if (typeof fn === "function" && fn.mockReturnThis) {
        fn.mockReturnThis();
      }
    });
  });

  // Prescription details are encrypted at rest; writes go through
  // /api/clinical/prescriptions.
  describe("createPrescription()", () => {
    it("POSTs the prescription to the encrypting API", async () => {
      mockFetchOnce({ prescription: { id: "rx123", medication_name: "Amoxicillin" } }, 201);
      const result = await createPrescription(
        {
          appointment_id: "apt123",
          patient_id: "patient123",
          doctor_id: "doctor123",
          medication_name: "Amoxicillin",
          dosage: "500mg",
          frequency: "3 times daily",
          duration: "7 days",
        } as any,
        "doctor123",
      );
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ id: "rx123" });
      expect(lastFetch()).toMatchObject({ url: "/api/clinical/prescriptions", method: "POST" });
      expect(lastFetch().body.medication_name).toBe("Amoxicillin");
    });

    it("returns the server error", async () => {
      mockFetchOnce({ error: "Could not create prescription" }, 403);
      const result = await createPrescription({} as any, "d");
      expect(result).toEqual({ success: false, error: "Could not create prescription" });
    });
  });

  describe("hasAppointmentPrescriptions()", () => {
    it("should return true when prescriptions exist", async () => {
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [{ id: "rx123" }],
        error: null,
      });

      const result = await hasAppointmentPrescriptions("apt123");

      expect(result).toBe(true);
    });

    it("should return false when no prescriptions exist", async () => {
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await hasAppointmentPrescriptions("apt123");

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await hasAppointmentPrescriptions("apt123");

      expect(result).toBe(false);
    });
  });

  describe("getAppointmentPrescriptionCount()", () => {
    it("should return correct count", async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: [{ id: "1" }, { id: "2" }, { id: "3" }],
        error: null,
      });

      const result = await getAppointmentPrescriptionCount("apt123");

      expect(result).toBe(3);
    });

    it("should return 0 when no prescriptions", async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getAppointmentPrescriptionCount("apt123");

      expect(result).toBe(0);
    });
  });

  describe("getPatientPrescriptions()", () => {
    it("fetches decrypted prescriptions and adds doctor details", async () => {
      mockFetchOnce({
        prescriptions: [
          { id: "rx1", medication_name: "Aspirin", doctors: { first_name: "Jane", last_name: "Smith", specialization: "Cardiology" } },
        ],
      });
      const result = await getPatientPrescriptions("patient123");
      expect(lastFetch().url).toBe("/api/clinical/prescriptions?patientId=patient123");
      expect(result[0]).toMatchObject({ medication_name: "Aspirin", doctor_name: "Dr. Jane Smith" });
    });

    it("returns an empty list on error", async () => {
      mockFetchOnce({ error: "x" }, 500);
      expect(await getPatientPrescriptions("patient123")).toEqual([]);
    });
  });

  describe("getAppointmentPrescriptions()", () => {
    it("fetches prescriptions for the appointment", async () => {
      mockFetchOnce({ prescriptions: [] });
      expect(await getAppointmentPrescriptions("apt123")).toEqual([]);
      expect(lastFetch().url).toBe("/api/clinical/prescriptions?appointmentId=apt123");
    });
  });

  describe("updatePrescriptionStatus()", () => {
    it("PATCHes the new status", async () => {
      mockFetchOnce({ success: true });
      const result = await updatePrescriptionStatus("rx123", "completed", "doctor123");
      expect(result.success).toBe(true);
      expect(lastFetch()).toEqual({
        url: "/api/clinical/prescriptions",
        method: "PATCH",
        body: { id: "rx123", status: "completed" },
      });
    });

    it("includes notes when provided", async () => {
      mockFetchOnce({ success: true });
      await updatePrescriptionStatus("rx123", "discontinued", "doctor123", "Side effects");
      expect(lastFetch().body).toEqual({ id: "rx123", status: "discontinued", notes: "Side effects" });
    });
  });

  describe("getPrescriptionLogs()", () => {
    it("should fetch prescription logs", async () => {
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [{ id: "1", action: "created" }],
        error: null,
      });

      const result = await getPrescriptionLogs();

      expect(Array.isArray(result)).toBe(true);
    });


  });

  describe("startVideoCall()", () => {
    it("should start video call successfully", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: "call123", call_link: "https://meet.example.com/123" },
        error: null,
      });

      const result = await startVideoCall("apt123", "patient123", "doctor123");

      expect(result.success).toBe(true);
    });


  });

  describe("endVideoCall()", () => {
    it("should end video call successfully", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: "call123", status: "ended" },
        error: null,
      });

      const result = await endVideoCall("apt123");

      expect(result.success).toBe(true);
    });

    it("should include quality rating when provided", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: "call123" },
        error: null,
      });

      await endVideoCall("apt123", 5);

      expect(mockSupabaseChain.update).toHaveBeenCalled();
    });
  });

  describe("getVideoCallLogs()", () => {
    it("should fetch video call logs", async () => {
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [{ id: "1", appointment_id: "apt123" }],
        error: null,
      });

      const result = await getVideoCallLogs();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("searchPrescriptionsForPharmacy()", () => {

  });

  describe("markPrescriptionDispensed()", () => {
    it("asks the server to dispense (staff cannot set arbitrary status)", async () => {
      mockFetchOnce({ success: true });
      const result = await markPrescriptionDispensed("rx123", "staff1", "Given 14 tablets");
      expect(result.success).toBe(true);
      expect(lastFetch().body).toEqual({ id: "rx123", dispense: true, notes: "Given 14 tablets" });
    });
  });
});
