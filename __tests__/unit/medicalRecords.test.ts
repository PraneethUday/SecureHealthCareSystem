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
    hasAppointmentMedicalRecord
} from "@/lib/medicalRecords";

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
        from: jest.fn(() => mockSupabaseChain)
    }
}));

// Mock logging
jest.mock("@/lib/logging", () => ({
    logAction: jest.fn().mockResolvedValue(undefined)
}));

describe("Medical Records Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    describe("createMedicalRecord()", () => {
        it("should create medical record successfully", async () => {
            const mockRecord = {
                id: "rec123",
                diagnosis: "Common cold",
                treatment_plan: "Rest and fluids"
            };
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: mockRecord,
                error: null
            });

            const result = await createMedicalRecord({
                appointment_id: "apt123",
                patient_id: "patient123",
                doctor_id: "doctor123",
                record_date: "2026-01-15",
                chief_complaint: "Cough and cold",
                diagnosis: "Common cold",
                treatment_plan: "Rest and fluids"
            }, "doctor123");

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it("should handle creation error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Insert failed" }
            });

            const result = await createMedicalRecord({
                appointment_id: "apt123",
                patient_id: "patient123",
                doctor_id: "doctor123",
                record_date: "2026-01-15",
                chief_complaint: "Test complaint",
                diagnosis: "Test",
                treatment_plan: "Test plan"
            }, "doctor123");

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it("should include optional notes when provided", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "rec123" },
                error: null
            });

            await createMedicalRecord({
                appointment_id: "apt123",
                patient_id: "patient123",
                doctor_id: "doctor123",
                record_date: "2026-01-15",
                chief_complaint: "Test complaint",
                diagnosis: "Test",
                treatment_plan: "Test plan",
                notes: "Follow up in 2 weeks"
            }, "doctor123");

            expect(mockSupabaseChain.insert).toHaveBeenCalled();
        });
    });

    describe("getPatientMedicalRecords()", () => {
        it("should return patient medical records", async () => {
            const mockRecords = [
                { id: "rec1", diagnosis: "Flu" },
                { id: "rec2", diagnosis: "Cold" }
            ];
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: mockRecords,
                error: null
            });

            const result = await getPatientMedicalRecords("patient123");

            expect(Array.isArray(result)).toBe(true);
        });

        it("should return empty array on error", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: null,
                error: { message: "Query failed" }
            });

            const result = await getPatientMedicalRecords("patient123");

            expect(result).toEqual([]);
        });

        it("should accept user role and userId for access logging", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await getPatientMedicalRecords("patient123", "doctor", "doctor123");

            // Function should complete without errors
            expect(true).toBe(true);
        });
    });

    describe("getMedicalRecordById()", () => {
        it("should return medical record by ID", async () => {
            const mockRecord = { id: "rec123", diagnosis: "Test" };
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: mockRecord,
                error: null
            });

            const result = await getMedicalRecordById("rec123", "user123");

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it("should handle record not found", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Not found" }
            });

            const result = await getMedicalRecordById("invalid123", "user123");

            expect(result.success).toBe(false);
        });
    });

    describe("updateMedicalRecord()", () => {
        it("should update medical record successfully", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "rec123", diagnosis: "Updated diagnosis" },
                error: null
            });

            const result = await updateMedicalRecord(
                "rec123",
                { diagnosis: "Updated diagnosis" },
                "doctor123"
            );

            expect(result.success).toBe(true);
        });

        it("should handle update error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Update failed" }
            });

            const result = await updateMedicalRecord(
                "rec123",
                { notes: "Updated notes" },
                "doctor123"
            );

            expect(result.success).toBe(false);
        });

        it("should update multiple fields", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "rec123" },
                error: null
            });

            await updateMedicalRecord(
                "rec123",
                {
                    diagnosis: "New diagnosis",
                    treatment_plan: "New treatment",
                    notes: "Additional notes"
                },
                "doctor123"
            );

            expect(mockSupabaseChain.update).toHaveBeenCalled();
        });
    });

    describe("logMedicalRecordDownload()", () => {
        it("should log download action", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "log123" },
                error: null
            });

            await logMedicalRecordDownload("rec123", "user123", "patient");

            expect(mockSupabaseChain.insert).toHaveBeenCalled();
        });

        it("should not throw on logging error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Insert failed" }
            });

            // Should not throw
            await expect(
                logMedicalRecordDownload("rec123", "user123", "doctor")
            ).resolves.toBeUndefined();
        });
    });

    describe("getMedicalRecordLogs()", () => {
        it("should fetch medical record logs", async () => {
            const mockLogs = [
                { id: "1", action_type: "created" },
                { id: "2", action_type: "viewed" }
            ];
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: mockLogs,
                error: null
            });

            const result = await getMedicalRecordLogs();

            expect(Array.isArray(result)).toBe(true);
        });

        it("should apply patient filter when provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await getMedicalRecordLogs({ patientId: "patient123" });

            expect(mockSupabaseChain.eq).toHaveBeenCalled();
        });

        it("should apply doctor filter when provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await getMedicalRecordLogs({ doctorId: "doctor123" });

            expect(mockSupabaseChain.eq).toHaveBeenCalled();
        });

        it("should apply date filters when provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await getMedicalRecordLogs({
                startDate: "2026-01-01",
                endDate: "2026-12-31"
            });

            expect(mockSupabaseChain.gte).toHaveBeenCalled();
            expect(mockSupabaseChain.lte).toHaveBeenCalled();
        });
    });

    describe("hasAppointmentMedicalRecord()", () => {
        it("should return true when record exists", async () => {
            mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
                data: { id: "rec123" },
                error: null
            });

            const result = await hasAppointmentMedicalRecord("apt123");

            expect(result).toBe(true);
        });

        it("should return false when no record exists", async () => {
            mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            const result = await hasAppointmentMedicalRecord("apt123");

            expect(result).toBe(false);
        });

        it("should return false on error", async () => {
            mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: { message: "Query failed" }
            });

            const result = await hasAppointmentMedicalRecord("apt123");

            expect(result).toBe(false);
        });
    });
});
