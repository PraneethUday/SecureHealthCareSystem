import { NextResponse } from "next/server";
import { logToBlockchain } from "@/lib/blockchain/blockchainLogger";

export async function GET() {
  await logToBlockchain("TEST_LOG", {
    user_id: "test_user",
    user_role: "admin",
    resource_type: "test",
    resource_id: "blockchain_test",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
