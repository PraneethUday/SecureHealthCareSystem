"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  UserX,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  User,
  Hospital,
  RefreshCw,
} from "lucide-react";

interface AccessRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  appointmentDate: string;
  shareHealthProfile: boolean;
  status: "active" | "revoked" | "expired";
  appointmentStatus: string;
}

interface AccessManagementProps {
  patientId: string;
}

export default function AccessManagement({ patientId }: AccessManagementProps) {
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const revokeAccess = async (appointmentId: string, doctorName: string) => {
    try {
      setRevoking(appointmentId);
      const response = await fetch(`/api/patient/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, patientId }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Access revoked for Dr. ${doctorName}`,
        });
        // Update local state
        setAccessRecords((prev) =>
          prev.map((record) =>
            record.id === appointmentId
              ? { ...record, shareHealthProfile: false, status: "revoked" }
              : record,
          ),
        );
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.message || "Failed to revoke access",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setRevoking(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const grantAccess = async (appointmentId: string, doctorName: string) => {
    try {
      setRevoking(appointmentId);
      const response = await fetch(`/api/patient/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, patientId }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Access granted to Dr. ${doctorName}`,
        });
        // Update local state
        setAccessRecords((prev) =>
          prev.map((record) =>
            record.id === appointmentId
              ? { ...record, shareHealthProfile: true, status: "active" }
              : record,
          ),
        );
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.message || "Failed to grant access",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setRevoking(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const activeAccessCount = accessRecords.filter(
    (r) => r.shareHealthProfile && r.appointmentStatus === "scheduled",
  ).length;

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
          <RefreshCw
            className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {activeAccessCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {accessRecords.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Records
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Access Records List */}
      {/* Access Records List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : accessRecords.length === 0 ? (
          <div className="text-center py-10">
            <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              No access records found
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              When you share health records with doctors, they will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {accessRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Dr. {record.doctorName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Hospital className="w-3.5 h-3.5" />
                        <span>{record.hospitalName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Appointment:{" "}
                          {new Date(
                            record.appointmentDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        record.shareHealthProfile
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {record.shareHealthProfile
                        ? "Can View Records"
                        : "Access Revoked"}
                    </span>

                    {record.appointmentStatus === "scheduled" &&
                      (record.shareHealthProfile ? (
                        <button
                          onClick={() =>
                            revokeAccess(record.id, record.doctorName)
                          }
                          disabled={revoking === record.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {revoking === record.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            grantAccess(record.id, record.doctorName)
                          }
                          disabled={revoking === record.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {revoking === record.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Grant
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          Revoking access will prevent the doctor from viewing your health
          records during the appointment.
        </p>
      </div>
    </div>
  );
}
