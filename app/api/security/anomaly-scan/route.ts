import { guard } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runAnomalyScan } from "@/lib/security-monitoring";

export async function POST(request: Request) {
  const auth = await guard("admin");
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json();
    const { hoursLookback } = body;
    const adminId = auth.businessId;

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
