import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logToBlockchain } from "@/lib/blockchain/blockchainLogger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      ip_address,
      user_agent,
    } = body;

    const timestamp = new Date().toISOString();

    // 1️⃣ Write to blockchain FIRST (source of immutability)
    const { hash, txHash } = await logToBlockchain(action, {
      user_id,
      user_role,
      resource_type,
      resource_id,
      timestamp,
    });

    // 2️⃣ Insert into Supabase WITH blockchain proof
    const { error } = await supabase.from("access_logs").insert({
      user_id,
      user_role,
      action,
      resource_type,
      resource_id,
      ip_address,
      user_agent,
      audit_hash: hash,
      blockchain_tx_hash: txHash,
      timestamp,
      blockchain_verified: true, // since tx was just mined
      verified_at: timestamp,
    });

    if (error) {
      console.error("Supabase audit insert failed:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    console.log("✅ BLOCKCHAIN EVENT EMITTED + DB LOGGED");

    return NextResponse.json({
      ok: true,
      txHash,
      auditHash: hash,
    });
  } catch (err) {
    console.error("Audit API crashed:", err);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
