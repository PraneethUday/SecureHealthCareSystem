import { NextResponse } from "next/server";
import { logAction } from "@/lib/logging";

export async function POST(req: Request) {
    console.log("AUDIT API HIT – SERVER SIDE");
    const body = await req.json();

  await logAction({
    userId: body.userId,
    userRole: body.role,
    action: body.action,
    resourceType: "auth",
  });

  return NextResponse.json({ ok: true });
}

