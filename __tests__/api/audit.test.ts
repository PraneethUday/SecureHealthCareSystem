/**
 * @jest-environment node
 */

/**
 * API Route Tests for app/api/audit/route.ts and app/api/audit/logs/route.ts
 *
 * The caller's identity comes from the session, never from the request, so
 * these tests focus on that: unauthenticated calls are refused, and a
 * user_id/user_role in the body cannot change who the entry is recorded for.
 */

jest.mock("@/lib/supabase/server", () => require("../helpers/serverAuthMock"));

const mockInsert = jest.fn();
const mockQuery = jest.fn();

// Chainable query that records every filter applied to it.
const chain = (): any => {
  const calls: any[] = [];
  const c: any = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "then") {
          mockQuery(calls);
          return (resolve: any) => resolve({ data: [], error: null });
        }
        if (prop === "maybeSingle") {
          return () => {
            mockQuery(calls);
            return Promise.resolve({ data: null, error: null });
          };
        }
        return (...args: any[]) => {
          calls.push([prop, ...args]);
          return c;
        };
      },
    },
  );
  return c;
};

jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: (row: any) => {
        mockInsert(row);
        return Promise.resolve({ error: null });
      },
      select: () => chain(),
    })),
  },
}));

import { POST } from "@/app/api/audit/route";
import { GET } from "@/app/api/audit/logs/route";
import { setCurrentUser } from "../helpers/serverAuthMock";

const post = (body: any, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost:3000/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );

const get = (params: Record<string, string> = {}) => {
  const url = new URL("http://localhost:3000/api/audit/logs");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return GET(new Request(url.toString()));
};

describe("Audit API Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentUser(null);
  });

  describe("POST /api/audit", () => {
    it("rejects unauthenticated callers", async () => {
      const res = await post({ action: "login_success" });
      expect(res.status).toBe(401);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("records the entry for the signed-in user", async () => {
      setCurrentUser({ role: "doctor", businessId: "D001" });
      const res = await post({ action: "view_record", resource_type: "medical_record", resource_id: "rec123" });
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "D001",
          user_role: "doctor",
          action: "view_record",
          resource_id: "rec123",
          timestamp: expect.any(String),
        }),
      );
    });

    it("ignores a spoofed user_id/user_role in the body", async () => {
      setCurrentUser({ role: "patient", businessId: "P001" });
      await post({ user_id: "admin", user_role: "admin", action: "delete_user" });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "P001", user_role: "patient" }),
      );
    });

    it("takes IP and user agent from the request, not the body", async () => {
      setCurrentUser({ role: "nurse", businessId: "N001" });
      await post(
        { action: "x", ip_address: "6.6.6.6", user_agent: "forged" },
        { "x-forwarded-for": "10.0.0.7", "user-agent": "Mozilla/5.0" },
      );
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ ip_address: "10.0.0.7", user_agent: "Mozilla/5.0" }),
      );
    });
  });

  describe("GET /api/audit/logs", () => {
    it("rejects unauthenticated callers", async () => {
      expect((await get()).status).toBe(401);
    });

    it.each(["doctor", "nurse", "staff"])("forbids %s", async (role) => {
      setCurrentUser({ role });
      expect((await get()).status).toBe(403);
    });

    it("requires an MFA-verified session for admins", async () => {
      setCurrentUser({ role: "admin", aal: "aal1" });
      expect((await get()).status).toBe(403);
    });

    it("returns logs to an admin", async () => {
      setCurrentUser({ role: "admin" });
      const res = await get({ limit: "100" });
      expect(res.status).toBe(200);
      expect(Array.isArray((await res.json()).logs)).toBe(true);
    });

    it("scopes a patient to their own records whatever patientId they send", async () => {
      setCurrentUser({ role: "patient", businessId: "P001" });
      const res = await get({ patientId: "P002" });
      expect(res.status).toBe(200);
      const filters = mockQuery.mock.calls.flatMap(([calls]) => calls);
      expect(filters).toContainEqual(["eq", "patient_id", "P001"]);
      expect(filters).not.toContainEqual(["eq", "patient_id", "P002"]);
    });
  });
});
