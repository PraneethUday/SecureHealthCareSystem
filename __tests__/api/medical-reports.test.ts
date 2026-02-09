/**
 * API Route Tests for app/api/medical-reports/* endpoints
 * Tests medical reports upload, fetch, download, and view logging
 */

import { NextRequest } from "next/server";

// Mock supabase
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
};

const mockStorage = {
    upload: jest.fn().mockResolvedValue({ data: { path: "test/file.pdf" }, error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://example.com/file.pdf" } }),
    createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: "https://example.com/signed/file.pdf" },
        error: null
    }),
    remove: jest.fn().mockResolvedValue({ error: null })
};

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => mockSupabaseChain),
        storage: {
            from: jest.fn(() => mockStorage)
        }
    }
}));

// Import routes
import { POST as uploadReport, GET as getReports } from "@/app/api/medical-reports/route";
import { GET as downloadReport } from "@/app/api/medical-reports/download/route";
import { POST as logView } from "@/app/api/medical-reports/log-view/route";

describe("Medical Reports API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    describe("POST /api/medical-reports (Upload)", () => {
        it("should return 400 for missing required fields", async () => {
            const formData = new FormData();
            formData.append("patientId", "P001");
            // Missing other required fields

            const request = new NextRequest("http://localhost:3000/api/medical-reports", {
                method: "POST",
                body: formData
            });

            const response = await uploadReport(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("required");
        });

        it("should return 404 for non-existent patient", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

            const formData = new FormData();
            formData.append("patientId", "INVALID");
            formData.append("reportType", "lab_test");
            formData.append("reportName", "Blood Test");
            formData.append("uploadedByUserId", "doctor123");
            formData.append("uploadedByRole", "doctor");
            formData.append("file", new Blob(["test content"], { type: "application/pdf" }), "test.pdf");

            const request = new NextRequest("http://localhost:3000/api/medical-reports", {
                method: "POST",
                body: formData
            });

            const response = await uploadReport(request);

            expect(response.status).toBe(404);
        });

        it("should upload report successfully", async () => {
            // Mock patient lookup
            mockSupabaseChain.single
                .mockResolvedValueOnce({ data: { id: "uuid-123" }, error: null })
                .mockResolvedValueOnce({ data: { id: "report123" }, error: null });

            const formData = new FormData();
            formData.append("patientId", "P001");
            formData.append("reportType", "lab_test");
            formData.append("reportName", "Blood Test");
            formData.append("uploadedByUserId", "doctor123");
            formData.append("uploadedByRole", "doctor");
            formData.append("description", "Annual blood work");
            formData.append("reportDate", "2026-01-15");
            formData.append("file", new Blob(["test content"], { type: "application/pdf" }), "bloodtest.pdf");

            const request = new NextRequest("http://localhost:3000/api/medical-reports", {
                method: "POST",
                body: formData
            });

            const response = await uploadReport(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });

    describe("GET /api/medical-reports", () => {
        it("should return empty array when no reports found", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({ data: { id: "uuid-123" }, error: null });
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports?patientId=P001"
            );

            const response = await getReports(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.reports).toEqual([]);
        });

        it("should return reports for patient", async () => {
            const mockReports = [
                { id: "1", report_name: "Blood Test", patients: { first_name: "John", last_name: "Doe" } }
            ];
            mockSupabaseChain.single.mockResolvedValueOnce({ data: { id: "uuid-123" }, error: null });
            mockSupabaseChain.order.mockResolvedValueOnce({ data: mockReports, error: null });

            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports?patientId=P001"
            );

            const response = await getReports(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.reports)).toBe(true);
        });

        it("should filter by report type", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({ data: [], error: null });

            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports?reportType=lab_test"
            );

            const response = await getReports(request);

            expect(response.status).toBe(200);
        });
    });

    describe("GET /api/medical-reports/download", () => {
        it("should return 400 for missing parameters", async () => {
            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports/download"
            );

            const response = await downloadReport(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("required");
        });

        it("should return 404 for non-existent report", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports/download?reportId=invalid123"
            );

            const response = await downloadReport(request);

            expect(response.status).toBe(404);
        });

        it("should return signed URL for valid report", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { file_name: "test.pdf", file_url: "https://example.com/medical-reports/test.pdf" },
                error: null
            });

            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports/download?reportId=report123"
            );

            const response = await downloadReport(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.downloadUrl).toBeDefined();
        });

        it("should accept fileName parameter", async () => {
            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports/download?fileName=test/file.pdf"
            );

            const response = await downloadReport(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.downloadUrl).toBeDefined();
        });
    });

    describe("POST /api/medical-reports/log-view", () => {
        it("should return 400 for missing fields", async () => {
            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports/log-view",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                }
            );

            const response = await logView(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("required");
        });

        it("should log view action successfully", async () => {
            mockSupabaseChain.insert.mockResolvedValueOnce({ error: null });
            mockSupabaseChain.insert.mockResolvedValueOnce({ error: null });

            const request = new NextRequest(
                "http://localhost:3000/api/medical-reports/log-view",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reportId: "report123",
                        userId: "user123",
                        userRole: "patient"
                    })
                }
            );

            const response = await logView(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });
});
