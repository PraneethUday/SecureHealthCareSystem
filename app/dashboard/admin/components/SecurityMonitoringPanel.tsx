"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  Search as SearchIcon,
  Activity,
  FileWarning,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Clock,
  Loader2,
  Bell,
  Database,
  Archive,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  SecurityIncident,
  SecurityAlert,
  AuditRetentionPolicy,
  AnomalyDetectionResult,
  BreachReport,
} from "@/lib/database.types";

type SecurityTab = "threats" | "incidents" | "breach" | "retention";

interface SecurityMonitoringPanelProps {
  adminId: string;
}

export default function SecurityMonitoringPanel({
  adminId,
}: SecurityMonitoringPanelProps) {
  const [activeTab, setActiveTab] = useState<SecurityTab>("threats");
  const [loading, setLoading] = useState(false);

  // Threat Detection state
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult[]>([]);
  const [scanResult, setScanResult] = useState<{
    anomaliesFound: number;
    incidentsCreated: number;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  // Incidents state
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [incidentFilter, setIncidentFilter] = useState<string>("all");
  const [resolveModal, setResolveModal] = useState<{
    open: boolean;
    incidentId: string;
  }>({ open: false, incidentId: "" });
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Alerts state
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  // Breach Report state
  const [breachStartDate, setBreachStartDate] = useState("");
  const [breachEndDate, setBreachEndDate] = useState("");
  const [breachIncidentId, setBreachIncidentId] = useState("");
  const [breachReport, setBreachReport] = useState<BreachReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Retention state
  const [policies, setPolicies] = useState<AuditRetentionPolicy[]>([]);
  const [executingRetention, setExecutingRetention] = useState(false);
  const [retentionResult, setRetentionResult] = useState<{
    totalDeleted: number;
    results: Array<{ log_type: string; records_deleted: number }>;
  } | null>(null);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "threats" || activeTab === "incidents") {
        const [incRes, alertRes] = await Promise.all([
          fetch("/api/security/incidents"),
          fetch("/api/security/alerts"),
        ]);
        if (incRes.ok) {
          const data = await incRes.json();
          setIncidents(data.incidents || []);
        }
        if (alertRes.ok) {
          const data = await alertRes.json();
          setAlerts(data.alerts || []);
        }
      }
      if (activeTab === "retention") {
        const res = await fetch("/api/security/retention");
        if (res.ok) {
          const data = await res.json();
          setPolicies(data.policies || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch security data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === THREAT DETECTION ===
  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/security/anomaly-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, hoursLookback: 24 }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies || []);
        setScanResult({
          anomaliesFound: data.anomaliesFound,
          incidentsCreated: data.incidentsCreated,
        });
        // Refresh incidents
        fetchData();
      }
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  // === INCIDENTS ===
  const handleResolve = async () => {
    if (!resolveModal.incidentId) return;
    try {
      const res = await fetch("/api/security/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: resolveModal.incidentId,
          action: "resolve",
          resolvedBy: adminId,
          resolutionNotes,
        }),
      });
      if (res.ok) {
        setResolveModal({ open: false, incidentId: "" });
        setResolutionNotes("");
        fetchData();
      }
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  };

  const dismissAlertHandler = async (alertId: string) => {
    try {
      await fetch("/api/security/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, dismissedBy: adminId }),
      });
      fetchData();
    } catch (err) {
      console.error("Dismiss failed:", err);
    }
  };

  // === BREACH REPORT ===
  const generateReport = async () => {
    if (!breachStartDate || !breachEndDate) return;
    setGeneratingReport(true);
    setBreachReport(null);
    try {
      const res = await fetch("/api/security/breach-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: breachIncidentId || undefined,
          startDate: new Date(breachStartDate).toISOString(),
          endDate: new Date(breachEndDate).toISOString(),
          generatedBy: adminId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBreachReport(data.report);
      }
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = () => {
    if (!breachReport) return;
    const blob = new Blob([JSON.stringify(breachReport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `breach-report-${breachReport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // === RETENTION ===
  const updatePolicy = async (
    policyId: string,
    updates: Partial<AuditRetentionPolicy>,
  ) => {
    try {
      await fetch("/api/security/retention", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId, ...updates }),
      });
      fetchData();
    } catch (err) {
      console.error("Policy update failed:", err);
    }
  };

  const executeCleanup = async () => {
    setExecutingRetention(true);
    setRetentionResult(null);
    try {
      const res = await fetch("/api/security/retention", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRetentionResult(data);
        fetchData();
      }
    } catch (err) {
      console.error("Cleanup failed:", err);
    } finally {
      setExecutingRetention(false);
    }
  };

  // === HELPERS ===
  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "investigating":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "resolved":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "dismissed":
        return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const filteredIncidents =
    incidentFilter === "all"
      ? incidents
      : incidents.filter((i) => i.status === incidentFilter);

  const tabs: { key: SecurityTab; label: string; icon: any; count?: number }[] =
    [
      {
        key: "threats",
        label: "Threat Detection",
        icon: SearchIcon,
        count: alerts.length,
      },
      {
        key: "incidents",
        label: "Incidents",
        icon: AlertTriangle,
        count: incidents.filter((i) => i.status === "open").length,
      },
      { key: "breach", label: "Breach Evidence", icon: FileWarning },
      { key: "retention", label: "Retention Policies", icon: Archive },
    ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            {count !== undefined && count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* ── THREAT DETECTION TAB ── */}
      {activeTab === "threats" && !loading && (
        <div className="space-y-4">
          {/* Active Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Active Alerts ({alerts.length})
              </h4>
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {alerts.map((alert) => {
                  // Extract user details from metadata
                  const meta = alert.metadata as Record<string, any> | undefined;
                  const anomaly = meta?.anomaly as Record<string, any> | undefined;
                  const affectedUserId = anomaly?.user_id || meta?.affected_user_id || null;
                  const affectedUserRole = anomaly?.user_role || meta?.affected_user_role || null;
                  const eventCount = anomaly?.event_count || meta?.event_count || null;
                  const anomalyType = anomaly?.anomaly_type || meta?.anomaly_type || alert.alert_type;
                  const timeWindow = anomaly?.time_window || meta?.time_window || null;

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${severityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Header row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase border ${severityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className="text-sm font-semibold">
                              {alert.title}
                            </span>
                          </div>

                          {/* Message */}
                          <p className="text-xs opacity-80 mb-2">
                            {alert.message}
                          </p>

                          {/* User & Access Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-white/60 dark:bg-black/15 rounded-md border border-current/10">
                            {affectedUserId && (
                              <div>
                                <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">User ID</p>
                                <p className="text-xs font-mono font-semibold truncate" title={affectedUserId}>
                                  {affectedUserId}
                                </p>
                              </div>
                            )}
                            {affectedUserRole && (
                              <div>
                                <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Role</p>
                                <p className="text-xs font-semibold capitalize">
                                  {affectedUserRole}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Alert Type</p>
                              <p className="text-xs font-semibold capitalize">
                                {anomalyType.replace(/_/g, " ")}
                              </p>
                            </div>
                            {eventCount && (
                              <div>
                                <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Events</p>
                                <p className="text-xs font-bold">
                                  {eventCount} {timeWindow ? `(${timeWindow})` : ""}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <p className="text-[10px] opacity-50 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.created_at
                              ? new Date(alert.created_at).toLocaleString()
                              : "Unknown"}
                          </p>
                        </div>
                        <button
                          onClick={() => dismissAlertHandler(alert.id)}
                          className="ml-2 p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors flex-shrink-0"
                          title="Dismiss alert"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Run Scan */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/10 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Anomaly Detection Scanner
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Scans access logs for unusual patterns: off-hours access,
                  excessive record views, rapid-fire actions.
                </p>
              </div>
              <button
                onClick={runScan}
                disabled={scanning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {scanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SearchIcon className="w-4 h-4" />
                )}
                {scanning ? "Scanning..." : "Run Scan"}
              </button>
            </div>

            {/* Scan Results */}
            {scanResult && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Anomalies Found:
                    </span>
                    <span
                      className={`font-bold ${scanResult.anomaliesFound > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {scanResult.anomaliesFound}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Incidents Created:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {scanResult.incidentsCreated}
                    </span>
                  </div>
                </div>

                {anomalies.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {anomalies.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg text-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span className="text-red-800 dark:text-red-300 flex-1">
                          {a.details}
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-mono">
                          {a.event_count} events
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {anomalies.length === 0 && scanResult.anomaliesFound === 0 && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    No anomalies detected. System appears healthy.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INCIDENTS TAB ── */}
      {activeTab === "incidents" && !loading && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            {["all", "open", "investigating", "resolved", "dismissed"].map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setIncidentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    incidentFilter === filter
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter}
                  {filter !== "all" && (
                    <span className="ml-1 opacity-60">
                      ({incidents.filter((i) => i.status === filter).length})
                    </span>
                  )}
                </button>
              ),
            )}
            <button
              onClick={fetchData}
              className="ml-auto p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Incidents List */}
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Shield className="w-12 h-12 mb-3 opacity-40" />
              <p>No incidents found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase border ${severityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {incident.incident_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {incident.title}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.detected_at
                            ? new Date(incident.detected_at).toLocaleString()
                            : ""}
                        </span>
                        {incident.affected_user_id && (
                          <span>User: {incident.affected_user_id.substring(0, 8)}...</span>
                        )}
                      </div>
                      {incident.resolution_notes && (
                        <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded text-xs text-emerald-800 dark:text-emerald-300">
                          <strong>Resolution:</strong> {incident.resolution_notes}
                        </div>
                      )}
                    </div>
                    {incident.status === "open" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            setResolveModal({ open: true, incidentId: incident.id })
                          }
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Resolve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolve Modal */}
          {resolveModal.open && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Resolve Incident
                </h3>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the resolution and actions taken..."
                  className="w-full h-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setResolveModal({ open: false, incidentId: "" });
                      setResolutionNotes("");
                    }}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BREACH EVIDENCE TAB ── */}
      {activeTab === "breach" && !loading && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-red-900/10 dark:to-orange-900/5 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <FileWarning className="w-5 h-5 text-red-600 dark:text-red-400" />
              Generate Breach Evidence Report
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Collects all access logs, security incidents, failed login
              attempts, and affected users into a structured evidence package
              for HIPAA compliance (§164.404).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={breachStartDate}
                  onChange={(e) => setBreachStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={breachEndDate}
                  onChange={(e) => setBreachEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Related Incident ID (optional)
                </label>
                <input
                  type="text"
                  value={breachIncidentId}
                  onChange={(e) => setBreachIncidentId(e.target.value)}
                  placeholder="UUID"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              onClick={generateReport}
              disabled={!breachStartDate || !breachEndDate || generatingReport}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {generatingReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileWarning className="w-4 h-4" />
              )}
              {generatingReport ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {/* Report Preview */}
          {breachReport && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Breach Evidence Report
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {breachReport.id}
                  </p>
                </div>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Summary */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Summary
                  </h5>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {breachReport.summary}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {breachReport.affected_users.length}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Affected Users
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {breachReport.timeline.length}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      Timeline Events
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {breachReport.evidence.incidents.length}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      Incidents
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                {breachReport.recommendations.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
                      Recommendations
                    </h5>
                    <ul className="space-y-1">
                      {breachReport.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="text-amber-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RETENTION POLICIES TAB ── */}
      {activeTab === "retention" && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                Audit Log Retention Policies
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure how long different log types are retained before
                automatic cleanup.
              </p>
            </div>
            <button
              onClick={executeCleanup}
              disabled={executingRetention}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {executingRetention ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {executingRetention ? "Running..." : "Run Cleanup"}
            </button>
          </div>

          {/* Cleanup Result */}
          {retentionResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Cleanup Complete — {retentionResult.totalDeleted} records
                  removed
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {retentionResult.results.map((r, i) => (
                  <div
                    key={i}
                    className="text-xs text-emerald-700 dark:text-emerald-400"
                  >
                    {r.log_type}: {r.records_deleted} deleted
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Log Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Retention (Days)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Archive
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Last Run
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Deleted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {policies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {policy.display_name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {policy.log_type}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={30}
                        value={policy.retention_days}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 30) {
                            updatePolicy(policy.id, { retention_days: val });
                          }
                        }}
                        className="w-20 px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updatePolicy(policy.id, {
                            archive_before_delete: !policy.archive_before_delete,
                          })
                        }
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          policy.archive_before_delete
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                        }`}
                      >
                        {policy.archive_before_delete ? "Yes" : "No"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updatePolicy(policy.id, {
                            is_active: !policy.is_active,
                          })
                        }
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          policy.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {policy.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {policy.last_executed_at
                        ? new Date(policy.last_executed_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {policy.records_deleted_last_run ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
