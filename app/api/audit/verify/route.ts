import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeAuditHash } from "@/lib/auditHash";
import { verifyAuditOnBlockchain } from "@/lib/blockchain/blockchainLogger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { logId } = await req.json();

    // 1️⃣ Fetch log
    const { data: log, error } = await supabase
      .from("access_logs")
      .select("*")
      .eq("id", logId)
      .single();

    if (error || !log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // 2️⃣ Compute hash
    const hash = computeAuditHash(log);

    // 3️⃣ Verify on blockchain (READ-ONLY)
    const verified = await verifyAuditOnBlockchain(hash);

    // 4️⃣ Optional: persist verification
    if (verified) {
      await supabase
        .from("access_logs")
        .update({
          blockchain_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return NextResponse.json({ verified, hash });
  } catch (err) {
    console.error("Blockchain verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
