/**
 * @jest-environment node
 */

/**
 * API Route Tests for app/api/chatbot/route.ts
 *
 * The route authenticates the caller and hands the question to the
 * permission-aware assistant (tested in __tests__/unit/assistant.test.ts).
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/supabase/server", () => require("../helpers/serverAuthMock"));

const mockAnswer = jest.fn();
jest.mock("@/lib/ai/assistant", () => ({
  answerQuestion: (...args: any[]) => mockAnswer(...args),
}));

import { POST } from "@/app/api/chatbot/route";
import { setCurrentUser } from "../helpers/serverAuthMock";

const ask = (body: unknown) =>
  POST(
    new NextRequest("http://localhost:3000/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("Chatbot API Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentUser({ role: "patient", businessId: "P001" });
    mockAnswer.mockResolvedValue({
      reply: "Your diagnosis is stable angina [R1].",
      citations: [{ ref: "R1", sourceTable: "medical_records", sourceId: "rec1" }],
      outcome: "answered",
    });
  });

  it("rejects unauthenticated callers", async () => {
    setCurrentUser(null);
    expect((await ask({ message: "hi" })).status).toBe(401);
    expect(mockAnswer).not.toHaveBeenCalled();
  });

  it("requires an MFA-verified session for clinicians", async () => {
    setCurrentUser({ role: "nurse", aal: "aal1" });
    expect((await ask({ message: "hi" })).status).toBe(403);
    expect(mockAnswer).not.toHaveBeenCalled();
  });

  it.each([[{}], [{ message: 42 }], [{ message: null }], [{ message: "   " }], ["not json"]])(
    "returns 400 for an invalid body %p",
    async (body) => {
      expect((await ask(body)).status).toBe(400);
    },
  );

  it("answers as the signed-in user, whatever role the client claims", async () => {
    await ask({ message: "What is my diagnosis?", context: { role: "admin" } });
    expect(mockAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ role: "patient", businessId: "P001" }),
      "What is my diagnosis?",
    );
  });

  it("returns the reply with its citations", async () => {
    const res = await ask({ message: "What is my diagnosis?" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      reply: "Your diagnosis is stable angina [R1].",
      citations: [{ ref: "R1", sourceTable: "medical_records", sourceId: "rec1" }],
      outcome: "answered",
    });
  });

  it("truncates very long questions", async () => {
    await ask({ message: "x".repeat(5000) });
    expect(mockAnswer.mock.calls[0][1]).toHaveLength(2000);
  });

  it("returns 503 when the model is unavailable", async () => {
    mockAnswer.mockResolvedValueOnce({ reply: "unavailable", citations: [], outcome: "error" });
    expect((await ask({ message: "hi" })).status).toBe(503);
  });
});
