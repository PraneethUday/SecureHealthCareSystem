"use client";

import { useEffect, useState } from "react";
import {
  Pill,
  Calendar,
  User,
  FileText,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getPatientPrescriptions } from "@/lib/prescriptions";
import { PrescriptionWithDetails } from "@/lib/database.types";

interface PrescriptionsListProps {
  patientId: string;
}

export default function PrescriptionsList({
  patientId,
}: PrescriptionsListProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    loadPrescriptions();
  }, [patientId]);

  const loadPrescriptions = async () => {
    setLoading(true);
    const data = await getPatientPrescriptions(patientId);
    setPrescriptions(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "discontinued":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (filter === "all") return true;
    return rx.status === filter;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          My Prescriptions
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-sm rounded-lg transition ${filter === "all"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            All ({prescriptions.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1 text-sm rounded-lg transition ${filter === "active"
                ? "bg-green-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            Active ({prescriptions.filter((p) => p.status === "active").length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 text-sm rounded-lg transition ${filter === "completed"
                ? "bg-gray-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            Completed (
            {prescriptions.filter((p) => p.status === "completed").length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading prescriptions...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>No prescriptions found</p>
          <p className="text-sm mt-1">
            Prescriptions issued by your doctor will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-purple-300 dark:hover:border-purple-700 transition bg-white dark:bg-gray-800 shadow-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {prescription.medication_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Dr. {prescription.doctor_name}
                    </span>
                    {prescription.doctor_specialization && (
                      <span className="text-purple-600 dark:text-purple-400">
                        • {prescription.doctor_specialization}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(
                    prescription.status
                  )}`}
                >
                  {prescription.status.toUpperCase()}
                </span>
              </div>

              {/* Key Medication Details - Highlighted */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                    Dosage
                  </p>
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                    {prescription.dosage}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                    Frequency
                  </p>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    {prescription.frequency}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">
                    Duration
                  </p>
                  <p className="text-sm font-bold text-green-900 dark:text-green-100">
                    {prescription.duration}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">
                    Prescribed
                  </p>
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                    {new Date(prescription.prescribed_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              {prescription.instructions && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-3 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                        How to Take:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        {prescription.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {prescription.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-3 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                        Doctor's Notes:
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                        {prescription.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Timeline */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Treatment Period
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(prescription.start_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  {prescription.end_date && (
                    <>
                      <div className="text-gray-400">→</div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {new Date(prescription.end_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Prescription Metadata */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Created:{" "}
                    {new Date(
                      prescription.created_at || prescription.prescribed_date
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {prescription.updated_at &&
                  prescription.updated_at !== prescription.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Last updated:{" "}
                        {new Date(prescription.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
