import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/ai/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Permission-aware records assistant. Identity comes from the session and
// retrieval runs with the user's own JWT (never the service role), so RLS
// decides which records the model can see.
export async function POST(req: NextRequest) {
  const auth = await guard();
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => null);
  const message = body?.message;
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ reply: "No message provided." }, { status: 400 });
  }

  const result = await answerQuestion(auth, message.slice(0, 2000));
  return NextResponse.json(result, { status: result.outcome === "error" ? 503 : 200 });
}
