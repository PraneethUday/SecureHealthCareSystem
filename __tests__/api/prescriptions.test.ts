/**
 * API Route Tests for app/api/prescriptions/search/route.ts
 * Tests prescription search endpoint
 */

import { NextRequest } from "next/server";

// Mock supabase
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
};

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => mockSupabaseChain)
    }
}));

// Import route
import { GET } from "@/app/api/prescriptions/search/route";

describe("Prescriptions Search API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    describe("GET /api/prescriptions/search", () => {
        it("should return empty array when no prescriptions found", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions).toEqual([]);
        });

        it("should search by patient ID", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "uuid-123" },
                error: null
            });
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [
                    {
                        id: "rx1",
                        medication_name: "Aspirin",
                        doctors: { first_name: "John", last_name: "Smith" },
                        patients: { patient_id: "P001", first_name: "Jane", last_name: "Doe" }
                    }
                ],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientId=P001"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.prescriptions)).toBe(true);
        });

        it("should return empty array for non-existent patient ID", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Not found" }
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientId=INVALID"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions).toEqual([]);
        });

        it("should search by patient name", async () => {
            mockSupabaseChain.or.mockResolvedValueOnce({
                data: [{ id: "uuid-123" }],
                error: null
            });
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientName=John"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.prescriptions)).toBe(true);
        });

        it("should return empty for no matching patient names", async () => {
            mockSupabaseChain.or.mockResolvedValueOnce({
                data: [],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientName=NonExistent"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions).toEqual([]);
        });

        it("should filter by status", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [
                    { id: "rx1", status: "active", patients: {}, doctors: {} }
                ],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?status=active"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
        });

        it("should not filter when status is 'all'", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?status=all"
            );

            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("should combine patientId and status filters", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "uuid-123" },
                error: null
            });
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientId=P001&status=active"
            );

            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("should handle database errors", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: null,
                error: { message: "Database error" }
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Failed");
        });

        it("should transform prescription data correctly", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [
                    {
                        id: "rx1",
                        medication_name: "Aspirin",
                        dosage: "100mg",
                        doctors: {
                            first_name: "John",
                            last_name: "Smith",
                            specialization: "Cardiology"
                        },
                        patients: {
                            patient_id: "P001",
                            first_name: "Jane",
                            last_name: "Doe",
                            email: "jane@example.com",
                            phone_number: "1234567890"
                        }
                    }
                ],
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions[0].doctor_name).toBe("Dr. John Smith");
            expect(data.prescriptions[0].patient_name).toBe("Jane Doe");
            expect(data.prescriptions[0].patient_id).toBe("P001");
        });
    });
});
