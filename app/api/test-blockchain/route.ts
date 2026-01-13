import { NextResponse } from "next/server";
import { logToBlockchain } from "@/lib/blockchain/blockchainLogger";

export async function GET() {
  await logToBlockchain("TEST_LOG", {
    message: "Blockchain logging works",
    time: new Date().toISOString()
  });

  return NextResponse.json({ success: true });
}
