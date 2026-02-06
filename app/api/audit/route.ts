import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  console.log("AUDIT API HIT – SERVER SIDE");

  try {
    const body = await req.json();

    const {
      user_id,
      user_role,
      action,
      resource_type,
      resource_id,
      details,
      status,
      ip_address,
      user_agent,
    } = body;

    const timestamp = new Date().toISOString();

    // 1️⃣ Insert into Supabase (Standard Logging)
    const { error } = await supabase.from("access_logs").insert({
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

    console.log("✅ DB LOGGED (STANDARD)");

    return NextResponse.json({
      ok: true,
    });
  } catch (err) {
    console.error("Audit API crashed:", err);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
