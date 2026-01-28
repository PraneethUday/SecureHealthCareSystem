import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("✅ /api/chatbot HIT");

    const body = await req.json();
    const message = body?.message;
    const context = body?.context ?? {};

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { reply: "No message provided." },
        { status: 400 }
      );
    }

    const prompt = `
You are a healthcare system assistant inside a hospital app.

Rules:
- Do NOT diagnose diseases
- Do NOT prescribe medication
- Do NOT give treatment plans
- Provide general health education only
- If symptoms sound serious, advise seeing a doctor
- Help users with system usage and navigation
- Be calm, clear, and step-by-step

Context:
User role: ${context.role ?? "unknown"}
Page: ${context.page ?? "unknown"}

User: ${message}
Assistant:
`;

    console.log("➡️ Calling Ollama at http://127.0.0.1:11434/api/generate");

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // ⬇️ VERY IMPORTANT: no AbortController, no timeout
      body: JSON.stringify({
        model: "llama3.2:3b",
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unable to read error body");
      console.error("❌ Ollama HTTP error:", response.status, errText);

      return NextResponse.json(
        { reply: "The AI service is currently unavailable. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log("⬅️ Ollama responded successfully");

    return NextResponse.json({
      reply: data?.response ?? "No response from model.",
    });

  } catch (error: any) {
    // 👇 Handle aborts gracefully
    if (error?.name === "AbortError") {
      console.error("⚠️ Ollama request aborted (timeout or reload)");
      return NextResponse.json(
        { reply: "The AI took too long to respond. Please try again." },
        { status: 504 }
      );
    }

    console.error("❌ Chatbot API error:", error?.message ?? error);

    return NextResponse.json(
      { reply: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
