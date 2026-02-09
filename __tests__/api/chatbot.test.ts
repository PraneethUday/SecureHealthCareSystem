/**
 * API Route Tests for app/api/chatbot/route.ts
 * Tests chatbot API endpoint
 */

import { NextRequest } from "next/server";

// Mock global fetch for Ollama API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Import route after mocking
import { POST } from "@/app/api/chatbot/route";

// Helper to create mock NextRequest
function createMockNextRequest(body: any): NextRequest {
    const url = new URL("http://localhost:3000/api/chatbot");
    return new NextRequest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

describe("Chatbot API Route Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console output during tests
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    describe("POST /api/chatbot", () => {
        it("should return 400 for missing message", async () => {
            const request = createMockNextRequest({});
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.reply).toBe("No message provided.");
        });

        it("should return 400 for non-string message", async () => {
            const request = createMockNextRequest({ message: 123 });
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.reply).toBe("No message provided.");
        });

        it("should return 400 for null message", async () => {
            const request = createMockNextRequest({ message: null });
            const response = await POST(request);

            expect(response.status).toBe(400);
        });

        it("should call Ollama API with correct prompt", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ response: "Hello! How can I help you?" })
            });

            const request = createMockNextRequest({
                message: "What are my appointments?",
                context: { role: "patient", page: "dashboard" }
            });

            await POST(request);

            expect(mockFetch).toHaveBeenCalledWith(
                "http://127.0.0.1:11434/api/generate",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                })
            );
        });

        it("should return AI response on success", async () => {
            const aiResponse = "I can help you with your healthcare questions.";
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ response: aiResponse })
            });

            const request = createMockNextRequest({
                message: "How do I book an appointment?"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.reply).toBe(aiResponse);
        });

        it("should handle Ollama API error", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve("Internal server error")
            });

            const request = createMockNextRequest({
                message: "Test message"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.reply).toContain("unavailable");
        });

        it("should handle network error gracefully", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const request = createMockNextRequest({
                message: "Test message"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.reply).toContain("Something went wrong");
        });

        it("should handle abort error", async () => {
            const abortError = new Error("Aborted");
            abortError.name = "AbortError";
            mockFetch.mockRejectedValueOnce(abortError);

            const request = createMockNextRequest({
                message: "Test message"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(504);
            expect(data.reply).toContain("too long");
        });

        it("should include context in prompt", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ response: "Response" })
            });

            const request = createMockNextRequest({
                message: "Help",
                context: {
                    role: "doctor",
                    page: "appointments"
                }
            });

            await POST(request);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.prompt).toContain("doctor");
            expect(body.prompt).toContain("appointments");
        });

        it("should use correct Ollama model", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ response: "Response" })
            });

            const request = createMockNextRequest({
                message: "Test"
            });

            await POST(request);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.model).toBe("llama3.2:3b");
            expect(body.stream).toBe(false);
        });

        it("should handle empty response from Ollama", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            const request = createMockNextRequest({
                message: "Test"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.reply).toBe("No response from model.");
        });

        it("should handle default context values", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ response: "Response" })
            });

            const request = createMockNextRequest({
                message: "Test"
                // No context provided
            });

            await POST(request);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.prompt).toContain("unknown");
        });
    });
});
