import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a friendly and professional healthcare assistant named "MedBot" inside the SecureHealthCare hospital management system.

Rules you MUST follow:
- Do NOT diagnose diseases or medical conditions
- Do NOT prescribe medication or recommend dosages
- Do NOT give specific treatment plans
- Provide general health education and wellness tips only
- If symptoms sound serious or urgent, strongly advise the user to see a doctor immediately
- Help users navigate the healthcare system (booking appointments, understanding reports, using the app)
- Be empathetic, calm, clear, and concise
- Use simple language that patients can understand
- If you don't know something, say so honestly
- Keep responses focused and under 200 words unless the user asks for detail
- Format responses with bullet points or numbered lists when helpful`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { reply: "AI service is not configured. Please contact support." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const message = body?.message;
    const context = body?.context ?? {};

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { reply: "No message provided." },
        { status: 400 },
      );
    }

    // Limit message length to prevent abuse
    const trimmedMessage = message.slice(0, 2000);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const userContext = `\nUser role: ${context.role ?? "unknown"}\nCurrent page: ${context.page ?? "unknown"}`;
    const fullPrompt = `${SYSTEM_PROMPT}\n${userContext}\n\nUser: ${trimmedMessage}\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const reply = response.text();

    return NextResponse.json({
      reply: reply || "I couldn't generate a response. Please try again.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Chatbot API error:", err?.message ?? error);

    if (err?.message?.includes("API key")) {
      return NextResponse.json(
        { reply: "AI service authentication failed. Please contact support." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { reply: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
