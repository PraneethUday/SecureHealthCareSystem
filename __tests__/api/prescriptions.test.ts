/**
 * @jest-environment node
 */

/**
 * API Route Tests for app/api/prescriptions/search/route.ts (pharmacy search)
 *
 * Patients are looked up with the caller's own client (RLS limits them to
 * patients the caller serves) and prescriptions come back decrypted from
 * lib/clinical/records, which is mocked here.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/supabase/server", () => require("../helpers/serverAuthMock"));

const mockList = jest.fn();
jest.mock("@/lib/clinical/records", () => ({
  listPrescriptions: (...args: any[]) => mockList(...args),
  ClinicalError: class extends Error {},
}));
jest.mock("@/lib/clinical/respond", () => ({
  clinicalError: () => Response.json({ error: "Internal server error" }, { status: 500 }),
}));

let patientsResult: any = { data: [], error: null };
const patientQuery: any = {
  select: jest.fn(() => patientQuery),
  limit: jest.fn(() => patientQuery),
  eq: jest.fn(() => patientQuery),
  or: jest.fn(() => patientQuery),
  then: (resolve: any) => resolve(patientsResult),
};
const mockClient = { from: jest.fn(() => patientQuery) };

import { GET } from "@/app/api/prescriptions/search/route";
import { setCurrentUser } from "../helpers/serverAuthMock";

const search = (params: Record<string, string>) =>
  GET(new NextRequest(`http://localhost:3000/api/prescriptions/search?${new URLSearchParams(params)}`));

describe("Prescriptions Search API Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    patientsResult = { data: [], error: null };
    mockList.mockResolvedValue([]);
    setCurrentUser({ role: "staff", supabase: mockClient });
  });

  describe("authorization", () => {
    it("rejects unauthenticated callers", async () => {
      setCurrentUser(null);
      expect((await search({ patientId: "P001" })).status).toBe(401);
    });

    it.each(["patient", "admin"])("forbids %s", async (role) => {
      setCurrentUser({ role, supabase: mockClient });
      expect((await search({ patientId: "P001" })).status).toBe(403);
    });

    it("requires an MFA-verified session for staff", async () => {
      setCurrentUser({ role: "staff", aal: "aal1", supabase: mockClient });
      expect((await search({ patientId: "P001" })).status).toBe(403);
    });
  });

  describe("search", () => {
    it("returns an empty list when no search criteria are given", async () => {
      const res = await search({});
      expect(await res.json()).toEqual({ prescriptions: [] });
      expect(mockList).not.toHaveBeenCalled();
    });

    it("searches by patient ID through the caller's RLS-scoped client", async () => {
      patientsResult = { data: [{ id: "uuid-1" }], error: null };
      await search({ patientId: "P001", status: "active" });
      expect(patientQuery.eq).toHaveBeenCalledWith("patient_id", "P001");
      expect(mockList).toHaveBeenCalledWith(mockClient, { patientId: "uuid-1", status: "active" });
    });

    it("returns empty when the patient is not visible to the caller", async () => {
      const res = await search({ patientId: "P999" });
      expect(await res.json()).toEqual({ prescriptions: [] });
      expect(mockList).not.toHaveBeenCalled();
    });

    it("searches by name", async () => {
      patientsResult = { data: [{ id: "a" }, { id: "b" }], error: null };
      await search({ patientName: "Arun" });
      expect(patientQuery.or).toHaveBeenCalledWith("first_name.ilike.%Arun%,last_name.ilike.%Arun%");
      expect(mockList).toHaveBeenCalledTimes(2);
    });

    it("strips PostgREST filter syntax from the name (filter injection)", async () => {
      patientsResult = { data: [], error: null };
      await search({ patientName: "x%,id.neq.(0),first_name.ilike.*" });
      const filter = patientQuery.or.mock.calls[0][0] as string;
      expect(filter).toBe("first_name.ilike.%xidneq0firstnameilike%,last_name.ilike.%xidneq0firstnameilike%");
    });

    it("returns 500 when the patient lookup fails", async () => {
      patientsResult = { data: null, error: { message: "boom" } };
      expect((await search({ patientId: "P001" })).status).toBe(500);
    });

    it("adds display fields to decrypted prescriptions", async () => {
      patientsResult = { data: [{ id: "uuid-1" }], error: null };
      mockList.mockResolvedValue([
        {
          id: "rx1",
          medication_name: "Aspirin",
          doctors: { first_name: "Jane", last_name: "Smith", specialization: "Cardiology" },
          patients: { patient_id: "P001", first_name: "Arun", last_name: "K", email: "a***@email.com", phone_number: "XXXXXX3101" },
        },
      ]);
      const { prescriptions } = await (await search({ patientId: "P001" })).json();
      expect(prescriptions[0]).toMatchObject({
        medication_name: "Aspirin",
        patient_id: "P001",
        doctor_name: "Dr. Jane Smith",
        patient_name: "Arun K",
        patient_phone: "XXXXXX3101",
      });
    });
  });
});
