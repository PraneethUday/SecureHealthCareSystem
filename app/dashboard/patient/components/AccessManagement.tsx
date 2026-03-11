"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  UserX,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Hospital,
  RefreshCw,
  Timer,
  X,
} from "lucide-react";

interface AccessRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  appointmentDate: string;
  shareHealthProfile: boolean;
  accessExpiresAt: string | null;
  status: "active" | "revoked" | "expired";
  appointmentStatus: string;
}

/** One entry per doctor, aggregated from all their appointments */
interface DoctorAccessEntry {
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  hasActiveAccess: boolean;
  accessExpiresAt: string | null;
  /** The appointment id to use for grant/revoke actions */
  activeAppointmentId: string | null;
  latestAppointmentDate: string;
  hasUpcoming: boolean;
  appointmentCount: number;
}

interface AccessManagementProps {
  patientId: string;
}

export default function AccessManagement({ patientId }: AccessManagementProps) {
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingDoctor, setProcessingDoctor] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // Grant / set-expiry modal state
  const [grantingDoctor, setGrantingDoctor] = useState<DoctorAccessEntry | null>(null);
  const [editingExpiry, setEditingExpiry] = useState<DoctorAccessEntry | null>(null);
  const [expiresAt, setExpiresAt] = useState("");

  const fetchAccessRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/patient/access-records?patientId=${patientId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAccessRecords(data.records || []);
      }
    } catch (error) {
      console.error("Error fetching access records:", error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAccessRecords();
  }, [fetchAccessRecords]);

  /** Group appointments by doctor — one entry per doctor */
  const doctorEntries = useMemo<DoctorAccessEntry[]>(() => {
    const map = new Map<string, DoctorAccessEntry>();

    for (const record of accessRecords) {
      const existing = map.get(record.doctorId);
      const isUpcoming = record.appointmentStatus === "scheduled";

      if (!existing) {
        map.set(record.doctorId, {
          doctorId: record.doctorId,
          doctorName: record.doctorName,
          hospitalName: record.hospitalName,
          hasActiveAccess: record.shareHealthProfile,
          accessExpiresAt: record.shareHealthProfile ? record.accessExpiresAt : null,
          activeAppointmentId: record.shareHealthProfile ? record.id : null,
          latestAppointmentDate: record.appointmentDate,
          hasUpcoming: isUpcoming,
          appointmentCount: 1,
        });
      } else {
        existing.appointmentCount += 1;
        // Prefer active access info
        if (record.shareHealthProfile && !existing.hasActiveAccess) {
          existing.hasActiveAccess = true;
          existing.accessExpiresAt = record.accessExpiresAt;
          existing.activeAppointmentId = record.id;
        }
        // Track if there's any upcoming scheduled appointment
        if (isUpcoming) existing.hasUpcoming = true;
        // Keep the more recent appointment date
        if (record.appointmentDate > existing.latestAppointmentDate) {
          existing.latestAppointmentDate = record.appointmentDate;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Active access first, then by latest appointment date
      if (a.hasActiveAccess !== b.hasActiveAccess)
        return a.hasActiveAccess ? -1 : 1;
      return b.latestAppointmentDate.localeCompare(a.latestAppointmentDate);
    });
  }, [accessRecords]);

  const activeCount = doctorEntries.filter((d) => d.hasActiveAccess).length;

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const revokeAccess = async (entry: DoctorAccessEntry) => {
    try {
      setProcessingDoctor(entry.doctorId);
      const response = await fetch(`/api/patient/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: entry.doctorId, patientId }),
      });

      if (response.ok) {
        showMessage("success", `Access revoked for Dr. ${entry.doctorName}`);
        setAccessRecords((prev) =>
          prev.map((r) =>
            r.doctorId === entry.doctorId
              ? { ...r, shareHealthProfile: false, accessExpiresAt: null, status: "revoked" }
              : r,
          ),
        );
      } else {
        const err = await response.json();
        showMessage("error", err.error || "Failed to revoke access");
      }
    } catch {
      showMessage("error", "An error occurred");
    } finally {
      setProcessingDoctor(null);
    }
  };

  const grantAccess = async () => {
    if (!grantingDoctor) return;
    try {
      setProcessingDoctor(grantingDoctor.doctorId);
      const body: Record<string, string> = {
        doctorId: grantingDoctor.doctorId,
        patientId,
      };
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

      const response = await fetch(`/api/patient/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const expiryNote = expiresAt
          ? ` (expires ${new Date(expiresAt).toLocaleDateString()})`
          : "";
        showMessage("success", `Access granted to Dr. ${grantingDoctor.doctorName}${expiryNote}`);
        // Refresh to get the updated appointmentId and expiry from server
        await fetchAccessRecords();
      } else {
        const err = await response.json();
        showMessage("error", err.error || "Failed to grant access");
      }
    } catch {
      showMessage("error", "An error occurred");
    } finally {
      setProcessingDoctor(null);
      setGrantingDoctor(null);
      setExpiresAt("");
    }
  };

  const updateExpiry = async () => {
    if (!editingExpiry) return;
    try {
      setProcessingDoctor(editingExpiry.doctorId);
      const body: Record<string, string> = {
        doctorId: editingExpiry.doctorId,
        patientId,
      };
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

      const response = await fetch(`/api/patient/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const note = expiresAt
          ? `Time limit set: expires ${new Date(expiresAt).toLocaleDateString()}`
          : `Time limit removed for Dr. ${editingExpiry.doctorName}`;
        showMessage("success", note);
        await fetchAccessRecords();
      } else {
        const err = await response.json();
        showMessage("error", err.error || "Failed to update time limit");
      }
    } catch {
      showMessage("error", "An error occurred");
    } finally {
      setProcessingDoctor(null);
      setEditingExpiry(null);
      setExpiresAt("");
    }
  };

  const formatExpiry = (isoDate: string) => {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `Expires in ${diffHours}h`;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return `Expires in ${diffDays}d (${d.toLocaleDateString()})`;
  };

  // Min datetime-local value = now + 1 hour
  const minExpiry = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Data Access Management
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Control who can view your medical records
            </p>
          </div>
        </div>
        <button
          onClick={fetchAccessRecords}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{doctorEntries.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Doctors</p>
          </div>
        </div>
      </div>

      {/* Toast Message */}
      {message && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Doctor Access List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : doctorEntries.length === 0 ? (
          <div className="text-center py-10">
            <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No access records found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              When you share health records with doctors, they will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {doctorEntries.map((entry) => (
              <div
                key={entry.doctorId}
                className={`rounded-lg border p-4 transition-all ${
                  entry.hasActiveAccess
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Dr. {entry.doctorName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Hospital className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{entry.hospitalName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>
                          Last appt:{" "}
                          {new Date(entry.latestAppointmentDate).toLocaleDateString()}
                          {entry.appointmentCount > 1 && (
                            <span className="ml-1 text-slate-400">
                              (+{entry.appointmentCount - 1} more)
                            </span>
                          )}
                        </span>
                      </div>
                      {entry.hasActiveAccess && entry.accessExpiresAt && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                          <Timer className="w-3 h-3 flex-shrink-0" />
                          <span>{formatExpiry(entry.accessExpiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                        entry.hasActiveAccess
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {entry.hasActiveAccess ? "Can View Records" : "No Access"}
                    </span>

                    {entry.hasActiveAccess ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingExpiry(entry);
                            setExpiresAt(
                              entry.accessExpiresAt
                                ? new Date(entry.accessExpiresAt).toISOString().slice(0, 16)
                                : "",
                            );
                          }}
                          disabled={processingDoctor === entry.doctorId}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          Set Time Limit
                        </button>
                        <button
                          onClick={() => revokeAccess(entry)}
                          disabled={processingDoctor === entry.doctorId}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {processingDoctor === entry.doctorId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                          Revoke
                        </button>
                      </>
                    ) : entry.hasUpcoming ? (
                      <button
                        onClick={() => setGrantingDoctor(entry)}
                        disabled={processingDoctor === entry.doctorId}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {processingDoctor === entry.doctorId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Grant
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Appt. ended
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Access is automatically revoked when an appointment ends.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <Timer className="w-3.5 h-3.5 flex-shrink-0" />
          You can also set a time limit when granting access.
        </p>
      </div>

      {/* Grant Access Modal */}
      {grantingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Grant Access
              </h3>
              <button
                onClick={() => { setGrantingDoctor(null); setExpiresAt(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Dr. {grantingDoctor.doctorName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {grantingDoctor.hospitalName}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Access expires at{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    min={minExpiry}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {!expiresAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Leave blank to grant access until manually revoked or appointment ends.
                  </p>
                )}
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "24 hours", hours: 24 },
                  { label: "48 hours", hours: 48 },
                  { label: "1 week", hours: 168 },
                ].map(({ label, hours }) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + hours * 60 * 60 * 1000);
                      setExpiresAt(d.toISOString().slice(0, 16));
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {label}
                  </button>
                ))}
                {expiresAt && (
                  <button
                    type="button"
                    onClick={() => setExpiresAt("")}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setGrantingDoctor(null); setExpiresAt(""); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={grantAccess}
                  disabled={processingDoctor === grantingDoctor.doctorId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {processingDoctor === grantingDoctor.doctorId ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Grant Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Time Limit Modal (for already-active access) */}
      {editingExpiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Set Time Limit
              </h3>
              <button
                onClick={() => { setEditingExpiry(null); setExpiresAt(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Dr. {editingExpiry.doctorName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingExpiry.hospitalName}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Access expires at{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    min={minExpiry}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {!expiresAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Leave blank to remove any existing time limit.
                  </p>
                )}
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "24 hours", hours: 24 },
                  { label: "48 hours", hours: 48 },
                  { label: "1 week", hours: 168 },
                ].map(({ label, hours }) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + hours * 60 * 60 * 1000);
                      setExpiresAt(d.toISOString().slice(0, 16));
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {label}
                  </button>
                ))}
                {expiresAt && (
                  <button
                    type="button"
                    onClick={() => setExpiresAt("")}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setEditingExpiry(null); setExpiresAt(""); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateExpiry}
                  disabled={processingDoctor === editingExpiry.doctorId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {processingDoctor === editingExpiry.doctorId ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Timer className="w-4 h-4" />
                  )}
                  {expiresAt ? "Set Time Limit" : "Remove Time Limit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
