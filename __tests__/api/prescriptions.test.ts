/**
 * @jest-environment node
 */

/**
 * API Route Tests for app/api/prescriptions/search/route.ts
 * Tests prescription search endpoint
 */

import { NextRequest } from "next/server";

// Mock data state - can be modified by tests
let mockQueryResult = { data: [], error: null };
let mockSingleResult = { data: null, error: null };
let mockOrResult = { data: [], error: null };

// Create a chainable mock
const createChainableMock = () => {
    const chain: any = {
        select: jest.fn(() => chain),
        eq: jest.fn(() => chain),
        or: jest.fn(() => Promise.resolve(mockOrResult)),
        in: jest.fn(() => chain),
        order: jest.fn(() => chain),
        single: jest.fn(() => Promise.resolve(mockSingleResult)),
        then: (resolve: any) => resolve(mockQueryResult),
    };
    return chain;
};

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => createChainableMock())
    }
}));

// Import route
import { GET } from "@/app/api/prescriptions/search/route";

describe("Prescriptions Search API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock data
        mockQueryResult = { data: [], error: null };
        mockSingleResult = { data: null, error: null };
        mockOrResult = { data: [], error: null };
    });

    describe("GET /api/prescriptions/search", () => {
        it("should return empty array when no prescriptions found", async () => {
            mockQueryResult = { data: [], error: null };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions).toEqual([]);
        });

        it("should search by patient ID", async () => {
            mockSingleResult = { data: { id: "uuid-123" }, error: null };
            mockQueryResult = {
                data: [
                    {
                        id: "rx1",
                        medication_name: "Aspirin",
                        doctors: { first_name: "John", last_name: "Smith" },
                        patients: { patient_id: "P001", first_name: "Jane", last_name: "Doe" }
                    }
                ],
                error: null
            };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientId=P001"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.prescriptions)).toBe(true);
        });

        it("should return empty array for non-existent patient ID", async () => {
            mockSingleResult = { data: null, error: { message: "Not found" } };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientId=INVALID"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions).toEqual([]);
        });

        it("should search by patient name", async () => {
            mockOrResult = { data: [{ id: "uuid-123" }], error: null };
            mockQueryResult = { data: [], error: null };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientName=John"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.prescriptions)).toBe(true);
        });

        it("should return empty for no matching patient names", async () => {
            mockOrResult = { data: [], error: null };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientName=NonExistent"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.prescriptions).toEqual([]);
        });

        it("should filter by status", async () => {
            mockQueryResult = {
                data: [{ id: "rx1", status: "active", patients: {}, doctors: {} }],
                error: null
            };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?status=active"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
        });

        it("should not filter when status is 'all'", async () => {
            mockQueryResult = { data: [], error: null };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?status=all"
            );

            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("should combine patientId and status filters", async () => {
            mockSingleResult = { data: { id: "uuid-123" }, error: null };
            mockQueryResult = { data: [], error: null };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search?patientId=P001&status=active"
            );

            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("should handle database errors", async () => {
            mockQueryResult = { data: null, error: { message: "Database error" } };

            const request = new NextRequest(
                "http://localhost:3000/api/prescriptions/search"
            );

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Failed");
        });

        it("should transform prescription data correctly", async () => {
            mockQueryResult = {
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
            };

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
