import { NextResponse } from "next/server";
import { getActiveAlerts, getAllAlerts, dismissAlert } from "@/lib/security-monitoring";
import type { SecuritySeverity } from "@/lib/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") !== "false";
  const severity = searchParams.get("severity") as SecuritySeverity | null;
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const alerts = activeOnly
      ? await getActiveAlerts(limit)
      : await getAllAlerts({
          severity: severity || undefined,
          dismissed: activeOnly ? false : undefined,
          limit,
        });

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("Security alerts GET error:", err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId, dismissedBy } = body;

    if (!alertId || !dismissedBy) {
      return NextResponse.json({ error: "Missing alertId or dismissedBy" }, { status: 400 });
    }

    const success = await dismissAlert(alertId, dismissedBy);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("Security alerts PATCH error:", err);
    return NextResponse.json({ error: "Failed to dismiss alert" }, { status: 500 });
  }
}
