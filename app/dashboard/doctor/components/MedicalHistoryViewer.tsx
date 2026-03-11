"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Loader2,
  Activity,
  Pill,
  Stethoscope,
  ClipboardList,
  AlertCircle,
  ThermometerSun,
  Heart,
} from "lucide-react";
import { getPatientMedicalRecords } from "@/lib/medicalRecords";
import { MedicalRecordWithDetails } from "@/lib/database.types";
import { getSession } from "@/lib/auth";

interface MedicalHistoryViewerProps {
  patientId: string;
  patientName?: string;
}

export default function MedicalHistoryViewer({
  patientId,
  patientName,
}: MedicalHistoryViewerProps) {
  const [records, setRecords] = useState<MedicalRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      const doctorId = session?.user?.doctor_id || patientId;
      const data = await getPatientMedicalRecords(
        patientId,
        "doctor",
        doctorId,
      );
      setRecords(data);
    } catch (err) {
      console.error("Error loading medical history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading medical history...
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
          No Medical Records
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
          No medical records have been created for{" "}
          {patientName || "this patient"} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {records.length} record{records.length !== 1 ? "s" : ""} found across
        all appointments
      </p>

      {records.map((record) => {
        const isExpanded = expandedId === record.id;

        return (
          <div
            key={record.id}
            className={`bg-white dark:bg-slate-800/50 rounded-xl border transition-colors ${
              isExpanded
                ? "border-blue-300 dark:border-blue-700"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            {/* Always-visible header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              <div className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mt-0.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Top row: date + doctor */}
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(record.record_date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {record.doctor_name && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      Dr. {record.doctor_name}
                      {record.doctor_specialization && (
                        <span className="text-slate-400">
                          · {record.doctor_specialization}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Chief complaint */}
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {record.chief_complaint}
                </p>

                {/* Diagnosis */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  <span className="font-medium">Dx:</span> {record.diagnosis}
                </p>
              </div>

              <div className="flex-shrink-0 p-1 rounded-lg bg-slate-100 dark:bg-slate-700 mt-0.5">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded detail panel */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3 space-y-4 animate-in slide-in-from-top-1 duration-150">
                {/* Vitals strip */}
                {(record.blood_pressure ||
                  record.heart_rate ||
                  record.temperature ||
                  record.weight ||
                  record.height) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" />
                      Vital Signs
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {record.blood_pressure && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400">BP</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {record.blood_pressure}
                          </p>
                        </div>
                      )}
                      {record.heart_rate && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400">Heart Rate</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {record.heart_rate} bpm
                          </p>
                        </div>
                      )}
                      {record.temperature && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400">Temperature</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {record.temperature}°C
                          </p>
                        </div>
                      )}
                      {record.weight && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400">Weight</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {record.weight} kg
                          </p>
                        </div>
                      )}
                      {record.height && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400">Height</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {record.height} cm
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Symptoms & Findings */}
                {(record.symptoms || record.examination_findings) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Symptoms & Findings
                    </p>
                    <div className="space-y-2">
                      {record.symptoms && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Symptoms
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.symptoms}
                          </p>
                        </div>
                      )}
                      {record.examination_findings && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Examination Findings
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.examination_findings}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Treatment & Follow-up */}
                {(record.treatment_plan ||
                  record.recommendations ||
                  record.follow_up_instructions) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" />
                      Treatment Plan
                    </p>
                    <div className="space-y-2">
                      {record.treatment_plan && (
                        <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5 font-medium">
                            Treatment
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.treatment_plan}
                          </p>
                        </div>
                      )}
                      {record.recommendations && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Recommendations
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.recommendations}
                          </p>
                        </div>
                      )}
                      {record.follow_up_instructions && (
                        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5 font-medium">
                            Follow-up
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.follow_up_instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lab / Test Results */}
                {(record.lab_results || record.test_results) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Lab & Test Results
                    </p>
                    <div className="space-y-2">
                      {record.lab_results && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Lab Results
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.lab_results}
                          </p>
                        </div>
                      )}
                      {record.test_results && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Test Results
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.test_results}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Allergies / Medications / History */}
                {(record.allergies ||
                  record.current_medications ||
                  record.past_medical_history) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5" />
                      Medical Background
                    </p>
                    <div className="space-y-2">
                      {record.allergies && (
                        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                          <p className="text-xs text-red-600 dark:text-red-400 mb-0.5 font-medium">
                            Allergies
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.allergies}
                          </p>
                        </div>
                      )}
                      {record.current_medications && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Current Medications
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.current_medications}
                          </p>
                        </div>
                      )}
                      {record.past_medical_history && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-400 mb-0.5">
                            Past Medical History
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {record.past_medical_history}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Doctor&apos;s Notes
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
