// lib/logging.ts

interface LogActionParams {
  userId: string;
  userRole: "admin" | "patient" | "doctor" | "nurse" | "staff";
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: string;
  status?: string;
  ipAddress?: string;
  userAgent?: string;
}



/**
 * Centralized audit logger
 * Client → /api/audit → DB
 * Server → Direct Supabase call
 */
export async function logAction(params: LogActionParams): Promise<void> {
  // If we are on the server, we cannot use relative URLs in fetch
  // Instead of fetching /api/audit, we can just call the db directly if we have supabase access
  if (typeof window === "undefined") {
    try {
      // Audit writes are privileged; only server code may insert directly.
      const { supabaseAdmin } = await import("./supabase-admin");
      const { error } = await supabaseAdmin.from("access_logs").insert({
        user_id: params.userId,
        user_role: params.userRole,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        details: params.details,
        status: params.status,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error("Server-side audit log failed:", error);
      }

      // Same event into the tamper-evident chain (no PHI in details).
      const { error: chainError } = await supabaseAdmin.rpc("append_audit_as", {
        p_actor_id: params.userId,
        p_actor_role: params.userRole,
        p_action: params.action,
        p_target_table: params.resourceType ?? null,
        p_target_id: params.resourceId ?? null,
        p_ip: params.ipAddress ?? null,
        p_details: { status: params.status ?? null },
      });
      if (chainError) {
        console.error("Audit chain append failed:", chainError);
      }
      return;
    } catch (err) {
      console.error("Server-side audit logging crashed:", err);
      return;
    }
  }

  // Browser-side logging (keep existing fetch for simplicity/consistency)
  try {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: params.userId,
        user_role: params.userRole,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        details: params.details,
        status: params.status,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Audit API failed:", text);
    }
  } catch (err) {
    console.error("Audit logging crashed:", err);
  }
}

/**
 * Fetch all audit logs (admin only)
 */
export async function getAllLogs(limit = 50) {
  if (typeof window === "undefined") {
    const { data, error } = await supabase
      .from("access_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  const res = await fetch(`/api/audit/logs?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  const data = await res.json();
  return data.logs;
}

/**
 * Fetch access logs for a specific patient
 */
