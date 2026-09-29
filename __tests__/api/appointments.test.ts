/**
 * @jest-environment node
 */

/**
 * API Route Tests for app/api/appointments/[appointmentId]/details/route.ts
 * Tests appointment details endpoint
 */

import { NextRequest } from "next/server";

// Mock supabase
const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockClient = { from: jest.fn(() => mockSupabaseChain) };

jest.mock("@/lib/supabase/server", () => require("../helpers/serverAuthMock"));

// Import route
import { GET } from "@/app/api/appointments/[appointmentId]/details/route";
import { setCurrentUser } from "../helpers/serverAuthMock";

describe("Appointment Details API Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Queries run as the signed-in user; RLS decides visibility.
    setCurrentUser({ role: "patient", supabase: mockClient });
    Object.values(mockSupabaseChain).forEach((fn) => {
      if (typeof fn === "function" && fn.mockReturnThis) {
        fn.mockReturnThis();
      }
    });
  });

  describe("GET /api/appointments/[appointmentId]/details", () => {
    it("rejects unauthenticated callers", async () => {
      setCurrentUser(null);
      const response = await GET(
        new NextRequest("http://localhost:3000/api/appointments/apt123/details"),
        { params: Promise.resolve({ appointmentId: "apt123" }) },
      );
      expect(response.status).toBe(401);
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it("should return 404 for non-existent appointment", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/appointments/invalid123/details",
      );

      const response = await GET(request, {
        params: Promise.resolve({ appointmentId: "invalid123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("should return appointment details successfully", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: "apt123",
          appointment_date: "2026-12-31",
          appointment_time: "10:00",
          reason: "Annual checkup",
          type: "in-person",
          profiles: { full_name: "John Doe" },
        },
        error: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/appointments/apt123/details",
      );

      const response = await GET(request, {
        params: Promise.resolve({ appointmentId: "apt123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appointment_date).toBe("2026-12-31");
      expect(data.appointment_time).toBe("10:00");
      expect(data.reason).toBe("Annual checkup");
      expect(data.type).toBe("in-person");
      expect(data.patient_name).toBe("John Doe");
    });

    it("should handle missing patient profile", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: "apt123",
          appointment_date: "2026-12-31",
          appointment_time: "10:00",
          reason: "Checkup",
          type: "telemedicine",
          profiles: null,
        },
        error: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/appointments/apt123/details",
      );

      const response = await GET(request, {
        params: Promise.resolve({ appointmentId: "apt123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.patient_name).toBe("Unknown Patient");
    });

    it("should handle exception gracefully", async () => {
      mockSupabaseChain.single.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = new NextRequest(
        "http://localhost:3000/api/appointments/apt123/details",
      );

      const response = await GET(request, {
        params: Promise.resolve({ appointmentId: "apt123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Internal");
    });

    it("should query correct appointment ID", async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: "specific-apt-id",
          appointment_date: "2026-01-15",
          appointment_time: "14:30",
          reason: "Follow-up",
          type: "in-person",
          profiles: { full_name: "Jane Smith" },
        },
        error: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/appointments/specific-apt-id/details",
      );

      await GET(request, {
        params: Promise.resolve({ appointmentId: "specific-apt-id" }),
      });

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
        "id",
        "specific-apt-id",
      );
    });
  });
});
