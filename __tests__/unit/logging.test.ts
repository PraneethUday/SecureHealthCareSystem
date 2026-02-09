/**
 * Unit Tests for lib/logging.ts
 * Tests audit logging functions
 */

import { logAction, getAllLogs, getPatientAccessLogs } from "@/lib/logging";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Logging Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockReset();
    });

    describe("logAction()", () => {
        it("should send POST request with correct payload", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ ok: true })
            });

            await logAction({
                userId: "user123",
                userRole: "patient",
                action: "login_success",
                resourceType: "auth"
            });

            expect(mockFetch).toHaveBeenCalledWith("/api/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: expect.stringContaining("user123")
            });
        });

        it("should include optional fields when provided", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ ok: true })
            });

            await logAction({
                userId: "user123",
                userRole: "doctor",
                action: "view_record",
                resourceType: "medical_record",
                resourceId: "record456",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0"
            });

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.resource_id).toBe("record456");
            expect(body.ip_address).toBe("192.168.1.1");
            expect(body.user_agent).toBe("Mozilla/5.0");
        });

        it("should handle API errors gracefully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: () => Promise.resolve("Server error")
            });

            // Should not throw
            await expect(logAction({
                userId: "user123",
                userRole: "patient",
                action: "test_action"
            })).resolves.toBeUndefined();
        });

        it("should handle network errors gracefully", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            // Should not throw
            await expect(logAction({
                userId: "user123",
                userRole: "admin",
                action: "test_action"
            })).resolves.toBeUndefined();
        });

        it("should accept all valid user roles", async () => {
            mockFetch.mockResolvedValue({ ok: true });

            const roles: Array<"admin" | "patient" | "doctor" | "nurse" | "staff"> = [
                "admin", "patient", "doctor", "nurse", "staff"
            ];

            for (const role of roles) {
                await logAction({
                    userId: "user123",
                    userRole: role,
                    action: "test_action"
                });
            }

            expect(mockFetch).toHaveBeenCalledTimes(5);
        });
    });

    describe("getAllLogs()", () => {
        it("should fetch logs with default limit", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ logs: [] })
            });

            await getAllLogs();

            expect(mockFetch).toHaveBeenCalledWith("/api/audit/logs?limit=50");
        });

        it("should fetch logs with custom limit", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ logs: [] })
            });

            await getAllLogs(100);

            expect(mockFetch).toHaveBeenCalledWith("/api/audit/logs?limit=100");
        });

        it("should return logs array", async () => {
            const mockLogs = [
                { id: "1", action: "login" },
                { id: "2", action: "logout" }
            ];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ logs: mockLogs })
            });

            const result = await getAllLogs();

            expect(result).toEqual(mockLogs);
        });

        it("should throw error on failed request", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false
            });

            await expect(getAllLogs()).rejects.toThrow("Failed to fetch audit logs");
        });
    });

    describe("getPatientAccessLogs()", () => {
        it("should fetch logs for specific patient", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ logs: [] })
            });

            await getPatientAccessLogs("P001");

            expect(mockFetch).toHaveBeenCalledWith("/api/audit/logs?patientId=P001&limit=100");
        });

        it("should return patient logs array", async () => {
            const mockLogs = [{ id: "1", resource_id: "P001" }];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ logs: mockLogs })
            });

            const result = await getPatientAccessLogs("P001");

            expect(result).toEqual(mockLogs);
        });

        it("should throw error on failed request", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false
            });

            await expect(getPatientAccessLogs("P001")).rejects.toThrow("Failed to fetch patient access logs");
        });
    });
});
