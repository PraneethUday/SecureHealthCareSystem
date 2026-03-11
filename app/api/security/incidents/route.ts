import { NextResponse } from "next/server";
import {
  getSecurityIncidents,
  createSecurityIncident,
  resolveIncident,
  updateIncidentStatus,
} from "@/lib/security-monitoring";
import type { SecurityIncidentType, SecuritySeverity, SecurityIncidentStatus } from "@/lib/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") as SecuritySeverity | null;
  const status = searchParams.get("status") as SecurityIncidentStatus | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const incidents = await getSecurityIncidents({
      severity: severity || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ incidents });
  } catch (err) {
    console.error("Security incidents GET error:", err);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { incident_type, severity, title, description, affected_user_id, affected_user_role, source_ip } = body;

    if (!incident_type || !severity || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const incident = await createSecurityIncident({
      incident_type: incident_type as SecurityIncidentType,
      severity: severity as SecuritySeverity,
      title,
      description,
      affected_user_id,
      affected_user_role,
      source_ip,
    });

    if (!incident) {
      return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
    }

    return NextResponse.json({ incident }, { status: 201 });
  } catch (err) {
    console.error("Security incidents POST error:", err);
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { incidentId, action, resolvedBy, resolutionNotes, status } = body;

    if (!incidentId) {
      return NextResponse.json({ error: "Missing incidentId" }, { status: 400 });
    }

    if (action === "resolve") {
      const success = await resolveIncident(incidentId, resolvedBy, resolutionNotes || "");
      return NextResponse.json({ success });
    }

    if (status) {
      const success = await updateIncidentStatus(incidentId, status as SecurityIncidentStatus);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Security incidents PATCH error:", err);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}
