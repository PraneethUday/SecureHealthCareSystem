/**
 * Unit Tests for lib/appointments.ts
 * Tests appointment management functions
 */

import {
    getHospitals,
    getDoctors,
    getAvailableTimeSlots,
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    completeAppointment,
    getAppointmentLogs
} from "@/lib/appointments";

// Mock supabase
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
};

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => mockSupabaseChain)
    }
}));

describe("Appointments Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset all mock implementations
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    describe("getHospitals()", () => {
        it("should return empty array when no hospitals exist", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            const result = await getHospitals();

            expect(result).toEqual([]);
        });

        it("should return hospitals list", async () => {
            const mockHospitals = [
                { id: "1", name: "City Hospital", address: "123 Main St" },
                { id: "2", name: "General Hospital", address: "456 Oak Ave" }
            ];
            mockSupabaseChain.order.mockResolvedValueOnce({ data: mockHospitals, error: null });

            const result = await getHospitals();

            expect(result).toEqual(mockHospitals);
        });

        it("should return empty array on error", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: null,
                error: { message: "Database error" }
            });

            const result = await getHospitals();

            expect(result).toEqual([]);
        });
    });

    describe("getDoctors()", () => {
        it("should return all doctors when no filter provided", async () => {
            const mockDoctors = [
                { id: "1", first_name: "John", specialization: "Cardiology" }
            ];
            mockSupabaseChain.order.mockResolvedValueOnce({ data: mockDoctors, error: null });

            const result = await getDoctors();

            expect(result).toEqual(mockDoctors);
        });

        it("should filter by hospital when hospitalId provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            await getDoctors("hospital123");

            expect(mockSupabaseChain.eq).toHaveBeenCalledWith("hospital_id", "hospital123");
        });

        it("should filter by specialization when provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            await getDoctors(undefined, "Cardiology");

            expect(mockSupabaseChain.eq).toHaveBeenCalledWith("specialization", "Cardiology");
        });

        it("should filter by both hospital and specialization", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            await getDoctors("hospital123", "Cardiology");

            expect(mockSupabaseChain.eq).toHaveBeenCalledTimes(2);
        });
    });

    describe("getAvailableTimeSlots()", () => {
        it("should return available time slots", async () => {
            mockSupabaseChain.eq.mockResolvedValueOnce({
                data: [{ appointment_time: "09:00" }],
                error: null
            });

            const result = await getAvailableTimeSlots("doctor123", "2026-12-31");

            expect(Array.isArray(result)).toBe(true);
        });

        it("should exclude already booked slots", async () => {
            mockSupabaseChain.eq.mockResolvedValueOnce({
                data: [
                    { appointment_time: "09:00" },
                    { appointment_time: "10:00" }
                ],
                error: null
            });

            const result = await getAvailableTimeSlots("doctor123", "2026-12-31");

            // Result should not include booked times
            expect(result).not.toContain("09:00");
            expect(result).not.toContain("10:00");
        });
    });

    describe("createAppointment()", () => {
        it("should create appointment successfully", async () => {
            const mockAppointment = {
                id: "apt123",
                patient_id: "patient123",
                doctor_id: "doctor123",
                status: "scheduled"
            };
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: mockAppointment,
                error: null
            });

            const result = await createAppointment({
                patientId: "patient123",
                doctorId: "doctor123",
                hospitalId: "hospital123",
                appointmentDate: "2026-12-31",
                appointmentTime: "10:00",
                reason: "Checkup"
            });

            expect(result.success).toBe(true);
            expect(result.appointment).toBeDefined();
        });

        it("should handle creation error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Insert failed" }
            });

            const result = await createAppointment({
                patientId: "patient123",
                doctorId: "doctor123",
                hospitalId: "hospital123",
                appointmentDate: "2026-12-31",
                appointmentTime: "10:00"
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it("should include optional fields when provided", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "apt123" },
                error: null
            });

            await createAppointment({
                patientId: "patient123",
                doctorId: "doctor123",
                hospitalId: "hospital123",
                appointmentDate: "2026-12-31",
                appointmentTime: "10:00",
                reason: "Annual checkup",
                notes: "Patient has diabetes",
                isTelemedicine: true
            });

            expect(mockSupabaseChain.insert).toHaveBeenCalled();
        });
    });

    describe("getPatientAppointments()", () => {
        it("should return patient appointments with details", async () => {
            const mockAppointments = [
                { id: "1", appointment_date: "2026-12-31", status: "scheduled" }
            ];
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: mockAppointments,
                error: null
            });

            const result = await getPatientAppointments("patient123");

            expect(Array.isArray(result)).toBe(true);
        });

        it("should return empty array on error", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: null,
                error: { message: "Query failed" }
            });

            const result = await getPatientAppointments("patient123");

            expect(result).toEqual([]);
        });
    });

    describe("getDoctorAppointments()", () => {
        it("should return doctor appointments", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [{ id: "1" }],
                error: null
            });

            const result = await getDoctorAppointments("doctor123");

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("updateAppointmentStatus()", () => {
        it("should update status successfully", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "apt123", status: "completed" },
                error: null
            });

            const result = await updateAppointmentStatus("apt123", "completed", "doctor123");

            expect(result.success).toBe(true);
        });

        it("should handle update error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Update failed" }
            });

            const result = await updateAppointmentStatus("apt123", "completed");

            expect(result.success).toBe(false);
        });
    });

    describe("cancelAppointment()", () => {
        it("should cancel appointment with reason", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "apt123", status: "cancelled" },
                error: null
            });

            const result = await cancelAppointment("apt123", "user123", "Schedule conflict");

            expect(result.success).toBe(true);
        });
    });

    describe("completeAppointment()", () => {
        it("should complete appointment", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "apt123", status: "completed" },
                error: null
            });

            const result = await completeAppointment("apt123", "doctor123");

            expect(result.success).toBe(true);
        });
    });

    describe("getAppointmentLogs()", () => {
        it("should fetch appointment logs without filters", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [{ id: "1", action: "created" }],
                error: null
            });

            const result = await getAppointmentLogs();

            expect(Array.isArray(result)).toBe(true);
        });

        it("should apply date filters when provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await getAppointmentLogs({
                startDate: "2026-01-01",
                endDate: "2026-12-31"
            });

            expect(mockSupabaseChain.gte).toHaveBeenCalled();
            expect(mockSupabaseChain.lte).toHaveBeenCalled();
        });
    });
});
