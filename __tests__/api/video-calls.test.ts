/**
 * API Route Tests for app/api/video-calls/initiate/route.ts
 * Tests video call initiation endpoint
 */

import { NextRequest } from "next/server";

// Mock supabase
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
};

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => mockSupabaseChain)
    }
}));

// Import route
import { POST } from "@/app/api/video-calls/initiate/route";

// Helper to create mock request
function createMockRequest(body: any): NextRequest {
    return new NextRequest("http://localhost:3000/api/video-calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

describe("Video Calls Initiate API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    describe("POST /api/video-calls/initiate", () => {
        it("should return 401 for missing userId", async () => {
            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userRole: "patient"
                // Missing userId
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toContain("Unauthorized");
        });

        it("should return 403 for non-patient user", async () => {
            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "doctor123",
                userRole: "doctor"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toContain("patients");
        });

        it("should return 404 for non-existent appointment", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Not found" }
            });

            const request = createMockRequest({
                appointmentId: "invalid123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain("not found");
        });

        it("should return 403 when patient doesn't own appointment", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: {
                    id: "apt123",
                    patient_id: "otherPatient",
                    doctor_id: "doctor123",
                    status: "scheduled"
                },
                error: null
            });

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toContain("not your appointment");
        });

        it("should return 400 for non-scheduled appointment", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: {
                    id: "apt123",
                    patient_id: "patient123",
                    doctor_id: "doctor123",
                    status: "completed"
                },
                error: null
            });

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("scheduled");
        });

        it("should return 400 for invalid doctor ID", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: {
                    id: "apt123",
                    patient_id: "patient123",
                    doctor_id: "doctor456",
                    status: "scheduled"
                },
                error: null
            });

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123", // Different from appointment's doctor
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("Invalid doctor");
        });

        it("should initiate video call successfully", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: "apt123",
                        patient_id: "patient123",
                        doctor_id: "doctor123",
                        status: "scheduled"
                    },
                    error: null
                })
                .mockResolvedValueOnce({
                    data: {
                        id: "call123",
                        status: "calling"
                    },
                    error: null
                });

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.callId).toBe("call123");
            expect(data.appointment).toBeDefined();
        });

        it("should return 500 when video call creation fails", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: "apt123",
                        patient_id: "patient123",
                        doctor_id: "doctor123",
                        status: "scheduled"
                    },
                    error: null
                })
                .mockResolvedValueOnce({
                    data: null,
                    error: { message: "Insert failed" }
                });

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Failed");
        });

        it("should create video call with correct data", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: "apt123",
                        patient_id: "patient123",
                        doctor_id: "doctor123",
                        status: "scheduled"
                    },
                    error: null
                })
                .mockResolvedValueOnce({
                    data: { id: "call123", status: "calling" },
                    error: null
                });

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            await POST(request);

            expect(mockSupabaseChain.insert).toHaveBeenCalled();
        });

        it("should handle exception gracefully", async () => {
            mockSupabaseChain.single.mockRejectedValueOnce(new Error("Unexpected error"));

            const request = createMockRequest({
                appointmentId: "apt123",
                doctorId: "doctor123",
                userId: "patient123",
                userRole: "patient"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Internal");
        });
    });
});
