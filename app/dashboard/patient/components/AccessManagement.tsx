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
    <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Data Access Management
              </h2>
              <p className="text-sm text-white/80">
                Control who can view your medical records
              </p>
            </div>
          </div>
          <button
            onClick={fetchAccessRecords}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 text-white ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeAccessCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Active Access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {accessRecords.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Records
              </p>
            </div>
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
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : accessRecords.length === 0 ? (
          <div className="text-center py-10">
            <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No access records found
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              When you share health records with doctors, they will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accessRecords.map((record) => (
              <div
                key={record.id}
                className={`rounded-xl border p-4 transition-all ${
                  record.shareHealthProfile
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.shareHealthProfile
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <User
                        className={`w-5 h-5 ${
                          record.shareHealthProfile
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Dr. {record.doctorName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Hospital className="w-4 h-4" />
                        <span>{record.hospitalName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          Appointment:{" "}
                          {new Date(
                            record.appointmentDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.shareHealthProfile
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {record.shareHealthProfile
                        ? "Can View Records"
                        : "Access Revoked"}
                    </span>

                    {/* Action Button */}
                    {record.appointmentStatus === "scheduled" &&
                      (record.shareHealthProfile ? (
                        <button
                          onClick={() =>
                            revokeAccess(record.id, record.doctorName)
                          }
                          disabled={revoking === record.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {revoking === record.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            grantAccess(record.id, record.doctorName)
                          }
                          disabled={revoking === record.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {revoking === record.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
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
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Revoking access will prevent the doctor from viewing your health
          records during the appointment.
        </p>
      </div>
    </div>
  );
}
