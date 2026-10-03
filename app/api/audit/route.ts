import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Who did it comes from the session, never from the request body.
    const caller = await getCurrentUser();
    if (!caller) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const user_id = caller.businessId;
    const user_role = caller.role;

    const body = await req.json();

    const {
      action,
      resource_type,
      resource_id,
      details,
      status,
    } = body;
    const ip_address = req.headers.get("x-forwarded-for") ?? null;
    const user_agent = req.headers.get("user-agent") ?? null;

    const timestamp = new Date().toISOString();

    // 1️⃣ Insert into Supabase (Standard Logging)
    const { error } = await supabaseAdmin.from("access_logs").insert({
      user_id,
      user_role,
      action,
      resource_type,
      resource_id,
      details,
      status,
      ip_address,
      user_agent,
      timestamp,
      blockchain_verified: false, // Standard log
    });

    if (error) {
      console.error("Supabase audit insert failed:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (err) {
    console.error("Audit API crashed:", err);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
