/**
 * @jest-environment node
 */

/**
 * API Route Tests for app/api/medical-reports/* endpoints
 *
 * Authorization model under test: the report/patient row must be visible to
 * the caller under RLS (their own client) before any storage operation, and
 * files are only ever handed out as short-lived signed URLs.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/supabase/server", () => require("../helpers/serverAuthMock"));
jest.mock("@/lib/logging", () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

// Per-table results for the caller's (RLS-scoped) client.
let rows: Record<string, any> = {};
const inserts: Record<string, any[]> = {};
const clientChain = (table: string): any => {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    maybeSingle: jest.fn(() => Promise.resolve({ data: rows[table] ?? null, error: null })),
    single: jest.fn(() => Promise.resolve(rows[`${table}:insert`] ?? { data: null, error: { message: "denied" } })),
    insert: jest.fn((row: any) => {
      (inserts[table] ??= []).push(row);
      if (table === "medical_report_logs") return Promise.resolve(rows["medical_report_logs:insert"] ?? { error: null });
      return chain;
    }),
    then: (resolve: any) => resolve({ data: rows[`${table}:list`] ?? [], error: null }),
  };
  return chain;
};
const mockClient = { from: jest.fn((t: string) => clientChain(t)) };

const mockStorage = {
  upload: jest.fn().mockResolvedValue({ data: { path: "x" }, error: null }),
  createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "https://signed.example/file" }, error: null }),
  remove: jest.fn().mockResolvedValue({ error: null }),
};
jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: { storage: { from: jest.fn(() => mockStorage) } },
}));

import { POST as uploadReport, GET as getReports } from "@/app/api/medical-reports/route";
import { GET as downloadReport } from "@/app/api/medical-reports/download/route";
import { POST as logView } from "@/app/api/medical-reports/log-view/route";
import { setCurrentUser } from "../helpers/serverAuthMock";

function uploadRequest(fields: Record<string, string>, withFile = true) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  if (withFile) fd.append("file", new File(["%PDF-1.4"], "blood test.pdf", { type: "application/pdf" }));
  return new NextRequest("http://localhost:3000/api/medical-reports", { method: "POST", body: fd });
}

describe("Medical Reports API Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rows = {};
    for (const k of Object.keys(inserts)) delete inserts[k];
    setCurrentUser({ role: "nurse", profileId: "nurse-uuid", supabase: mockClient });
  });

  describe("POST /api/medical-reports (upload)", () => {
    it("rejects unauthenticated callers", async () => {
      setCurrentUser(null);
      expect((await uploadReport(uploadRequest({ patientId: "P001" }))).status).toBe(401);
    });

    it.each(["staff", "admin"])("forbids %s", async (role) => {
      setCurrentUser({ role, supabase: mockClient });
      expect((await uploadReport(uploadRequest({ patientId: "P001" }))).status).toBe(403);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await uploadReport(uploadRequest({ patientId: "P001" }, false));
      expect(res.status).toBe(400);
    });

    it("returns 404 when the patient is not visible to the caller (RLS)", async () => {
      const res = await uploadReport(uploadRequest({ patientId: "P002", reportType: "lab", reportName: "CBC" }));
      expect(res.status).toBe(404);
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });

    it("uploads privately and records the uploader from the session", async () => {
      rows = {
        patients: { id: "patient-uuid" },
        "medical_reports:insert": { data: { id: "rep1" }, error: null },
      };
      const res = await uploadReport(
        uploadRequest({
          patientId: "P001",
          reportType: "lab",
          reportName: "CBC",
          uploadedByUserId: "someone-else",
          uploadedByRole: "admin",
        }),
      );
      expect(res.status).toBe(200);
      const [path] = mockStorage.upload.mock.calls[0];
      expect(path).toMatch(/^patient-uuid\/\d+_blood_test\.pdf$/);
      expect(inserts.medical_reports[0]).toMatchObject({
        patient_id: "patient-uuid",
        uploaded_by_user_id: "nurse-uuid",
        uploaded_by_role: "nurse",
        file_url: path, // object path, not a public URL
      });
    });

    it("removes the stored file when the insert is refused", async () => {
      rows = { patients: { id: "patient-uuid" } }; // insert resolves with an error
      const res = await uploadReport(uploadRequest({ patientId: "P001", reportType: "lab", reportName: "CBC" }));
      expect(res.status).toBe(403);
      expect(mockStorage.remove).toHaveBeenCalled();
    });
  });

  describe("GET /api/medical-reports", () => {
    it("rejects unauthenticated callers", async () => {
      setCurrentUser(null);
      expect((await getReports(new NextRequest("http://localhost:3000/api/medical-reports"))).status).toBe(401);
    });

    it("returns 403 for a patient outside the caller's care", async () => {
      const res = await getReports(new NextRequest("http://localhost:3000/api/medical-reports?patientId=P002"));
      expect(res.status).toBe(403);
      expect((await res.json()).accessDenied).toBe(true);
    });

    it("returns reports with short-lived signed URLs", async () => {
      rows = {
        patients: { id: "patient-uuid" },
        "medical_reports:list": [
          {
            id: "rep1",
            file_url: "patient-uuid/1_cbc.pdf",
            file_name: "cbc.pdf",
            patients: { patient_id: "P001", first_name: "Arun", last_name: "K", email: "a***@email.com" },
          },
        ],
      };
      const res = await getReports(new NextRequest("http://localhost:3000/api/medical-reports?patientId=P001"));
      const { reports } = await res.json();
      expect(reports[0]).toMatchObject({ file_url: "https://signed.example/file", patient_name: "Arun K" });
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith("patient-uuid/1_cbc.pdf", 3600);
    });
  });

  describe("GET /api/medical-reports/download", () => {
    it("requires a reportId (arbitrary file paths are not accepted)", async () => {
      const res = await downloadReport(
        new NextRequest("http://localhost:3000/api/medical-reports/download?fileName=P002/secret.pdf"),
      );
      expect(res.status).toBe(400);
      expect(mockStorage.createSignedUrl).not.toHaveBeenCalled();
    });

    it("returns 404 when the report is not visible to the caller", async () => {
      const res = await downloadReport(
        new NextRequest("http://localhost:3000/api/medical-reports/download?reportId=rep9"),
      );
      expect(res.status).toBe(404);
      expect(mockStorage.createSignedUrl).not.toHaveBeenCalled();
    });

    it("signs a 5-minute URL for a visible report", async () => {
      rows = { medical_reports: { file_url: "patient-uuid/1_cbc.pdf", file_name: "cbc.pdf" } };
      const res = await downloadReport(
        new NextRequest("http://localhost:3000/api/medical-reports/download?reportId=rep1"),
      );
      expect(await res.json()).toEqual({ downloadUrl: "https://signed.example/file", fileName: "cbc.pdf" });
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith("patient-uuid/1_cbc.pdf", 300);
    });
  });

  describe("POST /api/medical-reports/log-view", () => {
    const post = (body: any) =>
      logView(
        new NextRequest("http://localhost:3000/api/medical-reports/log-view", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      );

    it("returns 400 without a reportId", async () => {
      expect((await post({})).status).toBe(400);
    });

    it("logs the view as the signed-in user", async () => {
      const res = await post({ reportId: "rep1", userId: "forged", userRole: "admin" });
      expect(res.status).toBe(200);
      expect(inserts.medical_report_logs[0]).toMatchObject({
        report_id: "rep1",
        action_type: "viewed",
        performed_by_user_id: "nurse-uuid",
        performed_by_role: "nurse",
      });
    });

    it("returns 403 when the report is not visible (insert refused by RLS)", async () => {
      rows = { "medical_report_logs:insert": { error: { message: "rls" } } };
      expect((await post({ reportId: "rep9" })).status).toBe(403);
    });
  });
});
