// lib/security-monitoring.ts
// EPIC 5: Audit, Monitoring & Breach Handling
// Covers User Stories: 10577, 10578, 10580, 10583, 10585

import { supabase } from "./supabase";
import { createNotification } from "./notifications";
import type {
  SecurityIncident,
  SecurityIncidentType,
  SecuritySeverity,
  SecurityIncidentStatus,
  SecurityAlert,
  SecurityAlertType,
  AuditRetentionPolicy,
  AnomalyDetectionResult,
  BreachReport,
} from "./database.types";

// ==========================================
// 1. ANOMALY DETECTION (#10577)
// ==========================================

/**
 * Run anomaly detection against access_logs.
 * Calls the DB function and returns detected anomalies.
 */
export async function detectAnomalies(
  hoursLookback: number = 24,
): Promise<AnomalyDetectionResult[]> {
  try {
    const { data, error } = await supabase.rpc(
      "detect_unusual_access_patterns",
      { p_hours_lookback: hoursLookback },
    );

    if (error) {
      console.error("Anomaly detection failed:", error);
      return [];
    }

    return (data || []) as AnomalyDetectionResult[];
  } catch (err) {
    console.error("Anomaly detection exception:", err);
    return [];
  }
}

/**
 * Run a full anomaly scan: detect anomalies, auto-create incidents & alerts.
 * Returns the list of newly created incidents.
 */
export async function runAnomalyScan(
  adminId: string,
  hoursLookback: number = 24,
): Promise<{ anomalies: AnomalyDetectionResult[]; incidents: SecurityIncident[] }> {
  const anomalies = await detectAnomalies(hoursLookback);
  const incidents: SecurityIncident[] = [];

  for (const anomaly of anomalies) {
    const severityMap: Record<string, SecuritySeverity> = {
      off_hours_access: "medium",
      excessive_record_access: "high",
      rapid_fire_actions: "high",
    };

    const incident = await createSecurityIncident({
      incident_type: (anomaly.anomaly_type as SecurityIncidentType) || "unusual_access_pattern",
      severity: severityMap[anomaly.anomaly_type] || "medium",
      title: `${formatAnomalyType(anomaly.anomaly_type)} detected`,
      description: anomaly.details,
      affected_user_id: anomaly.user_id,
      affected_user_role: anomaly.user_role,
      evidence_snapshot: {
        anomaly_type: anomaly.anomaly_type,
        event_count: anomaly.event_count,
        time_window: anomaly.time_window,
        detected_by: "automated_scan",
        scan_initiated_by: adminId,
      },
    });

    if (incident) {
      incidents.push(incident);

      // Auto-create alert for admin
      await createSecurityAlert({
        alert_type: "anomaly_detected",
        severity: severityMap[anomaly.anomaly_type] || "medium",
        title: `Anomaly: ${formatAnomalyType(anomaly.anomaly_type)}`,
        message: `${anomaly.details} (${anomaly.event_count} events in ${anomaly.time_window})`,
        related_incident_id: incident.id,
        metadata: { anomaly },
      });
    }
  }

  return { anomalies, incidents };
}

function formatAnomalyType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ==========================================
// 2. SECURITY INCIDENT MANAGEMENT (#10578)
// ==========================================

interface CreateIncidentParams {
  incident_type: SecurityIncidentType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  affected_user_id?: string;
  affected_user_role?: string;
  source_ip?: string;
  user_agent?: string;
  evidence_snapshot?: Record<string, any>;
}

/**
 * Create a new security incident
 */
export async function createSecurityIncident(
  params: CreateIncidentParams,
): Promise<SecurityIncident | null> {
  try {
    const { data, error } = await supabase
      .from("security_incidents")
      .insert({
        incident_type: params.incident_type,
        severity: params.severity,
        title: params.title,
        description: params.description,
        affected_user_id: params.affected_user_id,
        affected_user_role: params.affected_user_role,
        source_ip: params.source_ip,
        user_agent: params.user_agent,
        evidence_snapshot: params.evidence_snapshot || {},
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create security incident:", error);
      return null;
    }

    // Send notification to admin
    await createNotification({
      recipientId: "admin",
      recipientRole: "admin",
      title: `🚨 Security Incident: ${params.title}`,
      message: `[${params.severity.toUpperCase()}] ${params.description}`,
      type: "security_alert",
      relatedEntityType: "security_incident",
      relatedEntityId: data.id,
      metadata: { severity: params.severity, incident_type: params.incident_type },
    });

    return data as SecurityIncident;
  } catch (err) {
    console.error("Create incident exception:", err);
    return null;
  }
}

/**
 * Get security incidents with optional filters
 */
export async function getSecurityIncidents(filters?: {
  severity?: SecuritySeverity;
  status?: SecurityIncidentStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<SecurityIncident[]> {
  try {
    let query = supabase
      .from("security_incidents")
      .select("*")
      .order("detected_at", { ascending: false });

    if (filters?.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDate) {
      query = query.gte("detected_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("detected_at", filters.endDate);
    }
    query = query.limit(filters?.limit || 100);

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch incidents:", error);
      return [];
    }

    return (data || []) as SecurityIncident[];
  } catch (err) {
    console.error("Fetch incidents exception:", err);
    return [];
  }
}

/**
 * Resolve a security incident
 */
export async function resolveIncident(
  incidentId: string,
  resolvedBy: string,
  resolutionNotes: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("security_incidents")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes,
      })
      .eq("id", incidentId);

    if (error) {
      console.error("Failed to resolve incident:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Resolve incident exception:", err);
    return false;
  }
}

/**
 * Update incident status
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: SecurityIncidentStatus,
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = { status };
    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("security_incidents")
      .update(updateData)
      .eq("id", incidentId);

    if (error) {
      console.error("Failed to update incident status:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Update incident status exception:", err);
    return false;
  }
}

// ==========================================
// 3. SUSPICIOUS ACTIVITY ALERTS (#10580)
// ==========================================

interface CreateAlertParams {
  alert_type: SecurityAlertType;
  severity: SecuritySeverity;
  title: string;
  message: string;
  related_incident_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a security alert
 */
export async function createSecurityAlert(
  params: CreateAlertParams,
): Promise<SecurityAlert | null> {
  try {
    const { data, error } = await supabase
      .from("security_alerts")
      .insert({
        alert_type: params.alert_type,
        severity: params.severity,
        title: params.title,
        message: params.message,
        related_incident_id: params.related_incident_id,
        metadata: params.metadata || {},
        is_dismissed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create security alert:", error);
      return null;
    }

    return data as SecurityAlert;
  } catch (err) {
    console.error("Create alert exception:", err);
    return null;
  }
}

/**
 * Get active (undismissed) security alerts
 */
export async function getActiveAlerts(limit: number = 50): Promise<SecurityAlert[]> {
  try {
    const { data, error } = await supabase
      .from("security_alerts")
      .select("*")
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch alerts:", error);
      return [];
    }

    return (data || []) as SecurityAlert[];
  } catch (err) {
    console.error("Fetch alerts exception:", err);
    return [];
  }
}

/**
 * Get all alerts (including dismissed) with optional filters
 */
export async function getAllAlerts(filters?: {
  severity?: SecuritySeverity;
  dismissed?: boolean;
  limit?: number;
}): Promise<SecurityAlert[]> {
  try {
    let query = supabase
      .from("security_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters?.dismissed !== undefined) {
      query = query.eq("is_dismissed", filters.dismissed);
    }
    query = query.limit(filters?.limit || 100);

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch all alerts:", error);
      return [];
    }

    return (data || []) as SecurityAlert[];
  } catch (err) {
    console.error("Fetch all alerts exception:", err);
    return [];
  }
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(
  alertId: string,
  dismissedBy: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("security_alerts")
      .update({
        is_dismissed: true,
        dismissed_by: dismissedBy,
        dismissed_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) {
      console.error("Failed to dismiss alert:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Dismiss alert exception:", err);
    return false;
  }
}

// ==========================================
// 4. BREACH NOTIFICATION EVIDENCE (#10583)
// ==========================================

/**
 * Generate a comprehensive breach evidence report.
 * Collects all relevant logs, incidents, and affected users.
 */
export async function generateBreachReport(params: {
  incidentId?: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
}): Promise<BreachReport> {
  const reportId = crypto.randomUUID();
  const timeRange = { start: params.startDate, end: params.endDate };

  // 1. Collect access logs in the time range
  const { data: accessLogs } = await supabase
    .from("access_logs")
    .select("*")
    .gte("timestamp", params.startDate)
    .lte("timestamp", params.endDate)
    .order("timestamp", { ascending: true })
    .limit(500);

  // 2. Collect security incidents in the time range
  const { data: incidents } = await supabase
    .from("security_incidents")
    .select("*")
    .gte("detected_at", params.startDate)
    .lte("detected_at", params.endDate)
    .order("detected_at", { ascending: true });

  // 3. Collect login attempts in the time range
  const { data: loginAttempts } = await supabase
    .from("login_attempts")
    .select("*")
    .gte("attempted_at", params.startDate)
    .lte("attempted_at", params.endDate)
    .order("attempted_at", { ascending: true })
    .limit(500);

  // 4. If specific incident, get its details
  let relatedIncident: SecurityIncident | null = null;
  if (params.incidentId) {
    const { data } = await supabase
      .from("security_incidents")
      .select("*")
      .eq("id", params.incidentId)
      .single();
    relatedIncident = data as SecurityIncident | null;
  }

  // 5. Identify affected users
  const affectedUsersMap = new Map<string, { user_id: string; user_role: string; impact: string }>();

  for (const incident of (incidents || [])) {
    if (incident.affected_user_id) {
      affectedUsersMap.set(incident.affected_user_id, {
        user_id: incident.affected_user_id,
        user_role: incident.affected_user_role || "unknown",
        impact: `Involved in incident: ${incident.title}`,
      });
    }
  }

  // Also check for failed login attempts as potential affected users
  for (const attempt of (loginAttempts || [])) {
    if (attempt.attempt_type === "failed" && !affectedUsersMap.has(attempt.user_id)) {
      affectedUsersMap.set(attempt.user_id, {
        user_id: attempt.user_id,
        user_role: attempt.user_role,
        impact: `Failed login attempts detected`,
      });
    }
  }

  // 6. Build timeline
  const timeline: Array<{ timestamp: string; event: string; details: string }> = [];

  for (const log of (accessLogs || [])) {
    timeline.push({
      timestamp: log.timestamp,
      event: `Access: ${log.action}`,
      details: `User ${log.user_id} (${log.user_role}) - ${log.resource_type || "system"}`,
    });
  }

  for (const incident of (incidents || [])) {
    timeline.push({
      timestamp: incident.detected_at,
      event: `Incident: ${incident.title}`,
      details: `[${incident.severity}] ${incident.description}`,
    });
  }

  for (const attempt of (loginAttempts || [])) {
    if (attempt.attempt_type === "failed") {
      timeline.push({
        timestamp: attempt.attempted_at,
        event: `Failed Login`,
        details: `User ${attempt.user_id} (${attempt.user_role}) - ${attempt.failure_reason}`,
      });
    }
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 7. Generate recommendations
  const recommendations: string[] = [];
  const incidentTypes = new Set((incidents || []).map((i: any) => i.incident_type));

  if (incidentTypes.has("brute_force_attempt") || incidentTypes.has("account_compromise")) {
    recommendations.push("Force password resets for all affected user accounts.");
    recommendations.push("Review and strengthen account lockout policies.");
  }
  if (incidentTypes.has("unauthorized_access") || incidentTypes.has("data_exfiltration_risk")) {
    recommendations.push("Audit all data access permissions and revoke unnecessary access.");
    recommendations.push("Notify affected patients about potential data exposure per HIPAA §164.404.");
  }
  if (incidentTypes.has("off_hours_access")) {
    recommendations.push("Implement time-based access controls for sensitive data.");
  }
  if (incidentTypes.has("excessive_record_access")) {
    recommendations.push("Review access patterns and implement rate limiting for record access.");
  }
  recommendations.push("Document all remediation steps for compliance records.");
  recommendations.push("Schedule a post-incident review meeting within 48 hours.");

  // 8. Build report
  const report: BreachReport = {
    id: reportId,
    generated_at: new Date().toISOString(),
    generated_by: params.generatedBy,
    incident_id: params.incidentId,
    time_range: timeRange,
    summary: relatedIncident
      ? `Breach evidence report for incident "${relatedIncident.title}" (${relatedIncident.severity}). ${(incidents || []).length} incidents, ${affectedUsersMap.size} affected users, ${timeline.length} events in timeline.`
      : `Breach evidence report for period ${params.startDate} to ${params.endDate}. ${(incidents || []).length} incidents, ${affectedUsersMap.size} affected users, ${timeline.length} events in timeline.`,
    affected_users: Array.from(affectedUsersMap.values()),
    timeline,
    evidence: {
      access_logs: accessLogs || [],
      incidents: incidents || [],
      login_attempts: loginAttempts || [],
    },
    recommendations,
  };

  // Log the report generation
  await createSecurityAlert({
    alert_type: "breach_suspected",
    severity: "critical",
    title: "Breach Evidence Report Generated",
    message: `Report ${reportId} generated by ${params.generatedBy} covering ${params.startDate} to ${params.endDate}`,
    metadata: { report_id: reportId, affected_user_count: affectedUsersMap.size },
  });

  return report;
}

// ==========================================
// 5. AUDIT LOG RETENTION POLICIES (#10585)
// ==========================================

/**
 * Get all retention policies
 */
export async function getRetentionPolicies(): Promise<AuditRetentionPolicy[]> {
  try {
    const { data, error } = await supabase
      .from("audit_retention_policies")
      .select("*")
      .order("log_type", { ascending: true });

    if (error) {
      console.error("Failed to fetch retention policies:", error);
      return [];
    }

    return (data || []) as AuditRetentionPolicy[];
  } catch (err) {
    console.error("Fetch retention policies exception:", err);
    return [];
  }
}

/**
 * Update a retention policy
 */
export async function updateRetentionPolicy(
  policyId: string,
  updates: {
    retention_days?: number;
    archive_before_delete?: boolean;
    is_active?: boolean;
  },
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("audit_retention_policies")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", policyId);

    if (error) {
      console.error("Failed to update retention policy:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Update retention policy exception:", err);
    return false;
  }
}

/**
 * Execute retention policies — calls the DB function to clean up old records.
 * Returns summary of what was deleted.
 */
export async function executeRetentionPolicies(): Promise<
  Array<{ log_type: string; records_deleted: number }>
> {
  try {
    const { data, error } = await supabase.rpc("apply_retention_policies");

    if (error) {
      console.error("Retention policy execution failed:", error);
      return [];
    }

    const results = (data || []) as Array<{ log_type: string; records_deleted: number }>;

    // Create an alert summarizing the cleanup
    const totalDeleted = results.reduce((sum, r) => sum + (r.records_deleted || 0), 0);
    if (totalDeleted > 0) {
      await createSecurityAlert({
        alert_type: "retention_executed",
        severity: "low",
        title: "Retention Policies Executed",
        message: `Cleanup completed: ${totalDeleted} records removed across ${results.length} log types.`,
        metadata: { results },
      });
    }

    return results;
  } catch (err) {
    console.error("Execute retention policies exception:", err);
    return [];
  }
}
