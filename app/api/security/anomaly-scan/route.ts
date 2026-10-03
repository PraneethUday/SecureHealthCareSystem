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

    // Rules over the hash-chained audit log (also scheduled via pg_cron).
    const { data: rules } = await auth.supabase.rpc("scan_security_anomalies", {
      p_lookback: `${hoursLookback || 24} hours`,
    });
    const newAlerts = (rules ?? []).reduce((n: number, r: { alerts_created: number }) => n + r.alerts_created, 0);

    return NextResponse.json({
      anomaliesFound: result.anomalies.length + newAlerts,
      auditRules: rules ?? [],
      incidentsCreated: result.incidents.length,
      anomalies: result.anomalies,
      incidents: result.incidents,
    });
  } catch (err) {
    console.error("Anomaly scan error:", err);
    return NextResponse.json({ error: "Anomaly scan failed" }, { status: 500 });
  }
}
