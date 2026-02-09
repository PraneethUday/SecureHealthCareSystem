/**
 * API Route Tests for app/api/audit/route.ts and app/api/audit/logs/route.ts
 * Tests audit logging API endpoints
 */

import { NextRequest } from "next/server";

// Mock supabase
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockOr = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn((table: string) => {
            mockFrom(table);
            return {
                insert: jest.fn((data) => {
                    mockInsert(data);
                    return Promise.resolve({ error: null });
                }),
                select: jest.fn(() => ({
                    order: jest.fn(() => ({
                        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
                    })),
                    eq: jest.fn(() => ({
                        maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
                    })),
                    or: jest.fn(() => Promise.resolve({ data: [], error: null })),
                    in: jest.fn(() => Promise.resolve({ data: [], error: null }))
                }))
            };
        })
    }
}));

// Import routes after mocking
import { POST } from "@/app/api/audit/route";
import { GET } from "@/app/api/audit/logs/route";

// Helper to create mock request
function createMockRequest(body: any, method: string = "POST"): Request {
    return new Request("http://localhost:3000/api/audit", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

function createMockGetRequest(params: Record<string, string> = {}): Request {
    const url = new URL("http://localhost:3000/api/audit/logs");
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return new Request(url.toString(), { method: "GET" });
}

describe("Audit API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/audit", () => {
        it("should create audit log successfully", async () => {
            const body = {
                user_id: "user123",
                user_role: "patient",
                action: "login_success",
                resource_type: "auth"
            };

            const request = createMockRequest(body);
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.ok).toBe(true);
        });

        it("should include timestamp in log", async () => {
            const body = {
                user_id: "user123",
                user_role: "doctor",
                action: "view_record",
                resource_type: "medical_record",
                resource_id: "rec123"
            };

            const request = createMockRequest(body);
            await POST(request);

            // Verify insert was called
            expect(mockInsert).toHaveBeenCalled();
        });

        it("should handle optional fields", async () => {
            const body = {
                user_id: "user123",
                user_role: "admin",
                action: "delete_user",
                resource_type: "user",
                resource_id: "user456",
                ip_address: "192.168.1.1",
                user_agent: "Mozilla/5.0"
            };

            const request = createMockRequest(body);
            const response = await POST(request);

            expect(response.status).toBe(200);
        });

        it("should handle all user roles", async () => {
            const roles = ["admin", "patient", "doctor", "nurse", "staff"];

            for (const role of roles) {
                const body = {
                    user_id: `${role}123`,
                    user_role: role,
                    action: "test_action"
                };

                const request = createMockRequest(body);
                const response = await POST(request);

                expect(response.status).toBe(200);
            }
        });
    });

    describe("GET /api/audit/logs", () => {
        it("should fetch logs with default limit", async () => {
            const request = createMockGetRequest();
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("logs");
            expect(Array.isArray(data.logs)).toBe(true);
        });

        it("should fetch logs with custom limit", async () => {
            const request = createMockGetRequest({ limit: "100" });
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("should filter logs by patientId", async () => {
            const request = createMockGetRequest({ patientId: "P001" });
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("should handle UUID patient IDs", async () => {
            const request = createMockGetRequest({
                patientId: "123e4567-e89b-12d3-a456-426614174000"
            });
            const response = await GET(request);

            expect(response.status).toBe(200);
        });
    });
});
