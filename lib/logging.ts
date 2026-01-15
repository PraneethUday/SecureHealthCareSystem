// lib/logging.ts

interface LogActionParams {
  userId: string;
  userRole: "admin" | "patient" | "doctor" | "nurse" | "staff";
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Centralized audit logger
 * Client → /api/audit → DB + Blockchain
 */
export async function logAction(params: LogActionParams): Promise<void> {
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
 * Goes through secure API
 */
export async function getAllLogs(limit = 50) {
  const res = await fetch(`/api/audit/logs?limit=${limit}`);

  if (!res.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  const data = await res.json();
  return data.logs;
}
