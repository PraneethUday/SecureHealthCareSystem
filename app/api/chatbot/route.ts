import { NextRequest, NextResponse } from "next/server";

/**
 * IMPORTANT:
 * This forces the API route to run in Node.js runtime.
 * Without this, Ollama calls will hang in Edge runtime.
 */
export const runtime = "nodejs";

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

    console.log("➡️ Calling Ollama");

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:3b",
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Ollama error:", errText);
      return NextResponse.json(
        { reply: "Ollama failed to generate a response." },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log("⬅️ Ollama responded");

    return NextResponse.json({
      reply: data.response ?? "No response from model.",
    });

  } catch (error) {
    console.error("❌ Chatbot API error:", error);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
