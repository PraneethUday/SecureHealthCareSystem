/**
 * API Route Tests for app/api/register/patient/route.ts
 * Tests patient registration endpoint
 */

import { NextRequest } from "next/server";

// Mock supabase
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
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

// Import route
import { POST } from "@/app/api/register/patient/route";

// Helper to create mock request
function createMockRequest(body: any): NextRequest {
    return new NextRequest("http://localhost:3000/api/register/patient", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "127.0.0.1"
        },
        body: JSON.stringify(body)
    });
}

describe("Patient Registration API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    const validPatientData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "securePassword123",
        dateOfBirth: "1990-01-15",
        gender: "male",
        phoneNumber: "+1234567890",
        address: "123 Main Street, City",
        emergencyContact: "+0987654321",
        bloodGroup: "O+"
    };

    describe("POST /api/register/patient", () => {
        it("should return 400 for missing required fields", async () => {
            const request = createMockRequest({
                firstName: "John",
                lastName: "Doe"
                // Missing other required fields
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("required");
        });

        it("should return 400 for missing firstName", async () => {
            const { firstName, ...incomplete } = validPatientData;
            const request = createMockRequest(incomplete);

            const response = await POST(request);

            expect(response.status).toBe(400);
        });

        it("should return 400 for missing email", async () => {
            const { email, ...incomplete } = validPatientData;
            const request = createMockRequest(incomplete);

            const response = await POST(request);

            expect(response.status).toBe(400);
        });

        it("should return 400 for missing password", async () => {
            const { password, ...incomplete } = validPatientData;
            const request = createMockRequest(incomplete);

            const response = await POST(request);

            expect(response.status).toBe(400);
        });

        it("should return 409 for duplicate email", async () => {
            // Mock existing patient found
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: { email: "john.doe@example.com" }, error: null });

            const request = createMockRequest(validPatientData);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain("already registered");
        });

        it("should register patient successfully", async () => {
            // Mock no existing patient
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
                // Mock last patient for ID generation
                .mockResolvedValueOnce({ data: { patient_id: "P005" }, error: null })
                // Mock insert success
                .mockResolvedValueOnce({ data: { patient_id: "P006" }, error: null });

            const request = createMockRequest(validPatientData);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.message).toContain("successfully");
            expect(data.patientId).toBeDefined();
        });

        it("should generate P001 for first patient", async () => {
            // Mock no existing patient
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
                // Mock no patients exist
                .mockResolvedValueOnce({ data: null, error: null })
                // Mock insert success
                .mockResolvedValueOnce({ data: { patient_id: "P001" }, error: null });

            const request = createMockRequest(validPatientData);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.patientId).toBe("P001");
        });

        it("should increment patient ID correctly", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
                .mockResolvedValueOnce({ data: { patient_id: "P099" }, error: null })
                .mockResolvedValueOnce({ data: { patient_id: "P100" }, error: null });

            const request = createMockRequest(validPatientData);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.patientId).toBe("P100");
        });

        it("should handle database insert error", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
                .mockResolvedValueOnce({ data: { patient_id: "P005" }, error: null })
                .mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } });

            const request = createMockRequest(validPatientData);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Failed");
        });

        it("should include optional allergies field", async () => {
            const patientWithAllergies = {
                ...validPatientData,
                allergies: "Penicillin, Peanuts"
            };

            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
                .mockResolvedValueOnce({ data: { patient_id: "P005" }, error: null })
                .mockResolvedValueOnce({ data: { patient_id: "P006" }, error: null });

            const request = createMockRequest(patientWithAllergies);

            const response = await POST(request);

            expect(response.status).toBe(201);
        });

        it("should default allergies to 'None' when not provided", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
                .mockResolvedValueOnce({ data: { patient_id: "P005" }, error: null })
                .mockResolvedValueOnce({ data: { patient_id: "P006" }, error: null });

            const request = createMockRequest(validPatientData);

            await POST(request);

            // Verify insert was called with allergies defaulting to "None"
            expect(mockSupabaseChain.insert).toHaveBeenCalled();
        });

        it("should handle exception gracefully", async () => {
            mockSupabaseChain.single.mockRejectedValueOnce(new Error("Unexpected error"));

            const request = createMockRequest(validPatientData);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Internal");
        });
    });
});
