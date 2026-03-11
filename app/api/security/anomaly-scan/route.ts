import { NextResponse } from "next/server";
import { runAnomalyScan } from "@/lib/security-monitoring";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminId, hoursLookback } = body;

    if (!adminId) {
      return NextResponse.json({ error: "Missing adminId" }, { status: 400 });
    }

    const result = await runAnomalyScan(adminId, hoursLookback || 24);

    return NextResponse.json({
      anomaliesFound: result.anomalies.length,
      incidentsCreated: result.incidents.length,
      anomalies: result.anomalies,
      incidents: result.incidents,
    });
  } catch (err) {
    console.error("Anomaly scan error:", err);
    return NextResponse.json({ error: "Anomaly scan failed" }, { status: 500 });
  }
}
