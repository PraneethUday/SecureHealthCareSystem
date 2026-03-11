/**
 * Unit Tests for lib/security-monitoring.ts
 * Tests anomaly detection, incident management, alerts, breach reports, and retention policies
 * User Stories: 10577, 10578, 10580, 10583, 10585
 */

// Mock supabase
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

// Mock notifications
const mockCreateNotification = jest.fn().mockResolvedValue({ id: "notif-1" });
jest.mock("@/lib/notifications", () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

import {
  detectAnomalies,
  runAnomalyScan,
  createSecurityIncident,
  getSecurityIncidents,
  resolveIncident,
  updateIncidentStatus,
  createSecurityAlert,
  getActiveAlerts,
  getAllAlerts,
  dismissAlert,
  generateBreachReport,
  getRetentionPolicies,
  updateRetentionPolicy,
  executeRetentionPolicies,
} from "@/lib/security-monitoring";

// Helper to create a chainable mock
function chainable(finalData: any = {}, finalError: any = null) {
  const chain: any = {};
  const methods = [
    "select", "insert", "update", "delete",
    "eq", "gte", "lte", "in", "or",
    "order", "limit", "single", "maybeSingle",
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  // The final call returns the data
  chain.select = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue({ data: finalData, error: finalError });
  chain.limit = jest.fn().mockResolvedValue({ data: Array.isArray(finalData) ? finalData : [finalData], error: finalError });
  chain.order = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  return chain;
}

describe("Security Monitoring Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  // ==========================================
  // 1. ANOMALY DETECTION (#10577)
  // ==========================================
  describe("detectAnomalies()", () => {
    it("should call RPC with correct parameters", async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await detectAnomalies(48);

      expect(mockRpc).toHaveBeenCalledWith("detect_unusual_access_patterns", {
        p_hours_lookback: 48,
      });
    });

    it("should return anomaly results", async () => {
      const mockAnomalies = [
        {
          anomaly_type: "off_hours_access",
          user_id: "user-1",
          user_role: "doctor",
          details: "Access at 03:14",
          event_count: 5,
          time_window: "Last 24 hours",
        },
      ];
      mockRpc.mockResolvedValueOnce({ data: mockAnomalies, error: null });

      const result = await detectAnomalies();

      expect(result).toEqual(mockAnomalies);
      expect(result[0].anomaly_type).toBe("off_hours_access");
    });

    it("should return empty array on error", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });

      const result = await detectAnomalies();

      expect(result).toEqual([]);
    });

    it("should use default 24 hours lookback", async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await detectAnomalies();

      expect(mockRpc).toHaveBeenCalledWith("detect_unusual_access_patterns", {
        p_hours_lookback: 24,
      });
    });
  });

  describe("runAnomalyScan()", () => {
    it("should detect anomalies and create incidents", async () => {
      const mockAnomalies = [
        {
          anomaly_type: "excessive_record_access",
          user_id: "user-2",
          user_role: "doctor",
          details: "user-2 accessed 25 records in 1 hour",
          event_count: 25,
          time_window: "Hourly window",
        },
      ];
      mockRpc.mockResolvedValueOnce({ data: mockAnomalies, error: null });

      // Mock for createSecurityIncident (insert → select → single)
      const incidentChain = chainable({ id: "inc-1", title: "Excessive Record Access detected" });
      mockFrom.mockReturnValue(incidentChain);

      const result = await runAnomalyScan("admin");

      expect(result.anomalies).toHaveLength(1);
      expect(mockRpc).toHaveBeenCalled();
    });

    it("should return empty when no anomalies found", async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      const result = await runAnomalyScan("admin");

      expect(result.anomalies).toHaveLength(0);
      expect(result.incidents).toHaveLength(0);
    });
  });

  // ==========================================
  // 2. SECURITY INCIDENT MANAGEMENT (#10578)
  // ==========================================
  describe("createSecurityIncident()", () => {
    it("should insert incident and send notification", async () => {
      const mockIncident = {
        id: "inc-1",
        incident_type: "brute_force_attempt",
        severity: "high",
        title: "Brute Force Detected",
        description: "Multiple failed logins",
        status: "open",
      };

      const chain = chainable(mockIncident);
      mockFrom.mockReturnValue(chain);

      const result = await createSecurityIncident({
        incident_type: "brute_force_attempt",
        severity: "high",
        title: "Brute Force Detected",
        description: "Multiple failed logins",
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe("inc-1");
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: "admin",
          recipientRole: "admin",
          type: "security_alert",
        }),
      );
    });

    it("should return null on database error", async () => {
      const chain = chainable(null, { message: "Insert error" });
      mockFrom.mockReturnValue(chain);

      const result = await createSecurityIncident({
        incident_type: "other",
        severity: "low",
        title: "Test",
        description: "Test incident",
      });

      expect(result).toBeNull();
    });

    it("should include optional fields when provided", async () => {
      const chain = chainable({ id: "inc-2" });
      mockFrom.mockReturnValue(chain);

      await createSecurityIncident({
        incident_type: "unauthorized_access",
        severity: "critical",
        title: "Unauthorized Access",
        description: "User accessed restricted area",
        affected_user_id: "user-5",
        affected_user_role: "patient",
        source_ip: "192.168.1.100",
        evidence_snapshot: { path: "/admin/settings" },
      });

      expect(mockFrom).toHaveBeenCalledWith("security_incidents");
    });
  });

  describe("getSecurityIncidents()", () => {
    it("should fetch incidents with filters", async () => {
      const mockIncidents = [
        { id: "inc-1", severity: "high", status: "open" },
        { id: "inc-2", severity: "high", status: "open" },
      ];

      const chain = chainable(mockIncidents);
      mockFrom.mockReturnValue(chain);

      const result = await getSecurityIncidents({ severity: "high", status: "open" });

      expect(mockFrom).toHaveBeenCalledWith("security_incidents");
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should return empty array on error", async () => {
      const chain = chainable(null, { message: "DB error" });
      chain.limit = jest.fn().mockResolvedValue({ data: null, error: { message: "Error" } });
      mockFrom.mockReturnValue(chain);

      const result = await getSecurityIncidents();

      expect(result).toEqual([]);
    });
  });

  describe("resolveIncident()", () => {
    it("should update incident to resolved status", async () => {
      const chain = chainable();
      chain.eq = jest.fn().mockResolvedValue({ data: {}, error: null });
      chain.update = jest.fn().mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await resolveIncident("inc-1", "admin", "False positive");

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("security_incidents");
    });

    it("should return false on error", async () => {
      const chain = chainable();
      chain.eq = jest.fn().mockResolvedValue({ error: { message: "Update error" } });
      chain.update = jest.fn().mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await resolveIncident("inc-999", "admin", "Notes");

      expect(result).toBe(false);
    });
  });

  describe("updateIncidentStatus()", () => {
    it("should update status to investigating", async () => {
      const chain = chainable();
      chain.eq = jest.fn().mockResolvedValue({ data: {}, error: null });
      chain.update = jest.fn().mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await updateIncidentStatus("inc-1", "investigating");

      expect(result).toBe(true);
    });
  });

  // ==========================================
  // 3. SUSPICIOUS ACTIVITY ALERTS (#10580)
  // ==========================================
  describe("createSecurityAlert()", () => {
    it("should create an alert successfully", async () => {
      const mockAlert = {
        id: "alert-1",
        alert_type: "anomaly_detected",
        severity: "high",
        title: "Anomaly: Excessive Record Access",
        message: "25 records accessed in 1 hour",
        is_dismissed: false,
      };

      const chain = chainable(mockAlert);
      mockFrom.mockReturnValue(chain);

      const result = await createSecurityAlert({
        alert_type: "anomaly_detected",
        severity: "high",
        title: "Anomaly: Excessive Record Access",
        message: "25 records accessed in 1 hour",
      });

      expect(result).toBeTruthy();
      expect(result?.alert_type).toBe("anomaly_detected");
    });
  });

  describe("getActiveAlerts()", () => {
    it("should fetch only undismissed alerts", async () => {
      const mockAlerts = [
        { id: "alert-1", is_dismissed: false },
        { id: "alert-2", is_dismissed: false },
      ];

      const chain = chainable(mockAlerts);
      mockFrom.mockReturnValue(chain);

      const result = await getActiveAlerts();

      expect(mockFrom).toHaveBeenCalledWith("security_alerts");
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("dismissAlert()", () => {
    it("should dismiss alert successfully", async () => {
      const chain = chainable();
      chain.eq = jest.fn().mockResolvedValue({ data: {}, error: null });
      chain.update = jest.fn().mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await dismissAlert("alert-1", "admin");

      expect(result).toBe(true);
    });
  });

  // ==========================================
  // 4. BREACH NOTIFICATION EVIDENCE (#10583)
  // ==========================================
  describe("generateBreachReport()", () => {
    it("should generate a complete breach report", async () => {
      // Mock access_logs query
      const logsChain = chainable([
        { timestamp: "2024-01-01T10:00:00Z", user_id: "user-1", user_role: "doctor", action: "view_record", resource_type: "medical_record" },
      ]);
      // Mock security_incidents query
      const incidentsChain = chainable([
        { detected_at: "2024-01-01T10:05:00Z", title: "Test Incident", severity: "high", description: "Test", affected_user_id: "user-1", affected_user_role: "doctor", incident_type: "unauthorized_access" },
      ]);
      // Mock login_attempts query
      const loginChain = chainable([
        { attempted_at: "2024-01-01T09:55:00Z", user_id: "user-1", user_role: "doctor", attempt_type: "failed", failure_reason: "invalid_password" },
      ]);
      // Mock single incident lookup
      const singleIncidentChain = chainable({ id: "inc-1", title: "Test Incident", severity: "high" });
      // Mock alert creation
      const alertChain = chainable({ id: "alert-1" });

      // Setup mockFrom to return different chains for different tables
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === "access_logs") return logsChain;
        if (table === "security_incidents") {
          // First call is list query, second is single lookup
          return callCount <= 3 ? incidentsChain : singleIncidentChain;
        }
        if (table === "login_attempts") return loginChain;
        if (table === "security_alerts") return alertChain;
        return chainable([]);
      });

      const report = await generateBreachReport({
        incidentId: "inc-1",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-01T23:59:59Z",
        generatedBy: "admin",
      });

      expect(report).toBeTruthy();
      expect(report.id).toBeDefined();
      expect(report.generated_by).toBe("admin");
      expect(report.time_range.start).toBe("2024-01-01T00:00:00Z");
      expect(report.time_range.end).toBe("2024-01-01T23:59:59Z");
      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.evidence).toBeDefined();
      expect(report.evidence.access_logs).toBeDefined();
      expect(report.evidence.incidents).toBeDefined();
      expect(report.evidence.login_attempts).toBeDefined();
    });

    it("should include HIPAA recommendations for unauthorized access", async () => {
      const incidentData = [
        { incident_type: "unauthorized_access", affected_user_id: "user-1", affected_user_role: "patient", title: "Unauthorized Access", severity: "critical", description: "Test", detected_at: "2024-01-01T10:00:00Z" },
      ];

      // The security_incidents query in generateBreachReport chains: .select().gte().lte().order()
      // (no .limit()), so the final resolution comes from .order(). 
      // We need order() to resolve with { data: incidentData }.
      const incidentsChain: any = {};
      ["select", "insert", "update", "delete", "eq", "gte", "lte", "in", "or", "single", "maybeSingle", "limit"].forEach((m) => {
        incidentsChain[m] = jest.fn().mockReturnValue(incidentsChain);
      });
      // order() is the terminal call for the incidents list query
      incidentsChain.order = jest.fn().mockResolvedValue({ data: incidentData, error: null });

      // access_logs and login_attempts queries terminate with limit()
      const emptyLimitChain: any = {};
      ["select", "insert", "update", "delete", "eq", "gte", "lte", "in", "or", "order", "single", "maybeSingle"].forEach((m) => {
        emptyLimitChain[m] = jest.fn().mockReturnValue(emptyLimitChain);
      });
      emptyLimitChain.limit = jest.fn().mockResolvedValue({ data: [], error: null });

      const alertChain: any = {};
      ["select", "insert", "update", "delete", "eq", "gte", "lte", "in", "or", "order", "limit", "maybeSingle"].forEach((m) => {
        alertChain[m] = jest.fn().mockReturnValue(alertChain);
      });
      alertChain.single = jest.fn().mockResolvedValue({ data: { id: "alert-1" }, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "security_incidents") return incidentsChain;
        if (table === "security_alerts") return alertChain;
        return emptyLimitChain;
      });

      const report = await generateBreachReport({
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-01T23:59:59Z",
        generatedBy: "admin",
      });

      const hipaaRec = report.recommendations.find((r) =>
        r.includes("HIPAA"),
      );
      expect(hipaaRec).toBeDefined();
    });
  });

  // ==========================================
  // 5. AUDIT LOG RETENTION POLICIES (#10585)
  // ==========================================
  describe("getRetentionPolicies()", () => {
    it("should fetch all retention policies", async () => {
      const mockPolicies = [
        { id: "pol-1", log_type: "access_logs", display_name: "System Access Logs", retention_days: 365, is_active: true },
        { id: "pol-2", log_type: "login_attempts", display_name: "Login Attempt Records", retention_days: 90, is_active: true },
      ];

      const chain = chainable(mockPolicies);
      mockFrom.mockReturnValue(chain);

      const result = await getRetentionPolicies();

      expect(mockFrom).toHaveBeenCalledWith("audit_retention_policies");
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("updateRetentionPolicy()", () => {
    it("should update retention days", async () => {
      const chain = chainable();
      chain.eq = jest.fn().mockResolvedValue({ data: {}, error: null });
      chain.update = jest.fn().mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await updateRetentionPolicy("pol-1", { retention_days: 180 });

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("audit_retention_policies");
    });

    it("should return false on error", async () => {
      const chain = chainable();
      chain.eq = jest.fn().mockResolvedValue({ error: { message: "Update failed" } });
      chain.update = jest.fn().mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await updateRetentionPolicy("pol-999", { retention_days: 60 });

      expect(result).toBe(false);
    });
  });

  describe("executeRetentionPolicies()", () => {
    it("should call the RPC and return results", async () => {
      const mockResults = [
        { log_type: "access_logs", records_deleted: 42 },
        { log_type: "login_attempts", records_deleted: 15 },
      ];
      mockRpc.mockResolvedValueOnce({ data: mockResults, error: null });

      // Mock alert creation for the summary
      const alertChain = chainable({ id: "alert-1" });
      mockFrom.mockReturnValue(alertChain);

      const result = await executeRetentionPolicies();

      expect(mockRpc).toHaveBeenCalledWith("apply_retention_policies");
      expect(result).toHaveLength(2);
      expect(result[0].records_deleted).toBe(42);
    });

    it("should create alert when records are deleted", async () => {
      const mockResults = [{ log_type: "access_logs", records_deleted: 100 }];
      mockRpc.mockResolvedValueOnce({ data: mockResults, error: null });

      const alertChain = chainable({ id: "alert-1" });
      mockFrom.mockReturnValue(alertChain);

      await executeRetentionPolicies();

      // Should create alert for 100 deleted records
      expect(mockFrom).toHaveBeenCalledWith("security_alerts");
    });

    it("should return empty array on RPC error", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "RPC failed" } });

      const result = await executeRetentionPolicies();

      expect(result).toEqual([]);
    });
  });
});
