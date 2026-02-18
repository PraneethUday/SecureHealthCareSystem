"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  User,
  Activity,
  Pill,
  Loader2,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  getPatientMedicalRecords,
  logMedicalRecordDownload,
} from "@/lib/medicalRecords";
import { MedicalRecordWithDetails } from "@/lib/database.types";
import jsPDF from "jspdf";
import Portal from "@/components/ui/Portal";

interface MedicalRecordsListProps {
  patientId: string;
}

export default function MedicalRecordsList({
  patientId,
}: MedicalRecordsListProps) {
  const [records, setRecords] = useState<MedicalRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] =
    useState<MedicalRecordWithDetails | null>(null);

  useEffect(() => {
    loadRecords();
  }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecords = async () => {
    setLoading(true);
    const data = await getPatientMedicalRecords(patientId);
    setRecords(data);
    setLoading(false);
  };

  const downloadAsPDF = async (record: MedicalRecordWithDetails) => {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(34, 139, 34);
    pdf.text("Medical Record", 20, 20);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Record Date: ${new Date(record.record_date).toLocaleDateString()}`,
      20,
      28,
    );

    // Patient & Doctor Info
    let y = 40;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Doctor: Dr. ${record.doctor_name}`, 20, y);
    y += 6;
    if (record.doctor_specialization) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Specialization: ${record.doctor_specialization}`, 20, y);
      y += 8;
    } else {
      y += 2;
    }

    // Chief Complaint & Diagnosis
    y += 5;
    pdf.setFontSize(14);
    pdf.setTextColor(220, 38, 38);
    pdf.text("Chief Complaint & Diagnosis", 20, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Chief Complaint: ${record.chief_complaint}`, 20, y);
    y += 6;

    const diagnosisLines = pdf.splitTextToSize(
      `Diagnosis: ${record.diagnosis}`,
      170,
    );
    pdf.text(diagnosisLines, 20, y);
    y += diagnosisLines.length * 5 + 5;

    // Vital Signs
    if (record.blood_pressure || record.heart_rate || record.temperature) {
      y += 5;
      pdf.setFontSize(14);
      pdf.setTextColor(59, 130, 246);
      pdf.text("Vital Signs", 20, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      if (record.blood_pressure) {
        pdf.text(`Blood Pressure: ${record.blood_pressure}`, 20, y);
        y += 6;
      }
      if (record.heart_rate) {
        pdf.text(`Heart Rate: ${record.heart_rate} bpm`, 20, y);
        y += 6;
      }
      if (record.temperature) {
        pdf.text(`Temperature: ${record.temperature}°F`, 20, y);
        y += 6;
      }
      if (record.weight) {
        pdf.text(`Weight: ${record.weight} kg`, 20, y);
        y += 6;
      }
      if (record.height) {
        pdf.text(`Height: ${record.height} cm`, 20, y);
        y += 6;
      }
    }

    // Add new page if needed
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    // Clinical Notes
    if (
      record.symptoms ||
      record.examination_findings ||
      record.treatment_plan
    ) {
      y += 5;
      pdf.setFontSize(14);
      pdf.setTextColor(34, 139, 34);
      pdf.text("Clinical Notes", 20, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      if (record.symptoms) {
        pdf.text("Symptoms:", 20, y);
        y += 5;
        const symptomsLines = pdf.splitTextToSize(record.symptoms, 170);
        pdf.text(symptomsLines, 20, y);
        y += symptomsLines.length * 5 + 3;
      }

      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      if (record.examination_findings) {
        pdf.text("Examination Findings:", 20, y);
        y += 5;
        const examLines = pdf.splitTextToSize(record.examination_findings, 170);
        pdf.text(examLines, 20, y);
        y += examLines.length * 5 + 3;
      }

      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      if (record.treatment_plan) {
        pdf.text("Treatment Plan:", 20, y);
        y += 5;
        const treatmentLines = pdf.splitTextToSize(record.treatment_plan, 170);
        pdf.text(treatmentLines, 20, y);
        y += treatmentLines.length * 5 + 3;
      }
    }

    // Recommendations
    if (record.recommendations) {
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      y += 5;
      pdf.setFontSize(14);
      pdf.setTextColor(234, 88, 12);
      pdf.text("Recommendations", 20, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const recLines = pdf.splitTextToSize(record.recommendations, 170);
      pdf.text(recLines, 20, y);
      y += recLines.length * 5 + 3;
    }

    // Follow-up
    if (record.follow_up_instructions) {
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      y += 5;
      pdf.setFontSize(14);
      pdf.setTextColor(147, 51, 234);
      pdf.text("Follow-up Instructions", 20, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const followUpLines = pdf.splitTextToSize(
        record.follow_up_instructions,
        170,
      );
      pdf.text(followUpLines, 20, y);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text("This is a computer-generated medical record.", 20, 285);
    pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, 290);

    // Save PDF
    const fileName = `Medical_Record_${
      new Date(record.record_date).toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);

    // Log the download (only if record has ID)
    if (record.id) {
      await logMedicalRecordDownload(record.id, patientId, "patient");
    }
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
          <p className="text-gray-500 mt-2">Loading medical records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>No medical records found</p>
          <p className="text-sm mt-1">
            Medical records from completed appointments will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-green-300 dark:hover:border-green-700 transition bg-white dark:bg-gray-800 shadow-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Medical Record
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                      {new Date(record.record_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Dr. {record.doctor_name}</span>
                    {record.doctor_specialization && (
                      <span className="text-green-600 dark:text-green-400">
                        • {record.doctor_specialization}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="px-3 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => downloadAsPDF(record)}
                    className="px-3 py-2 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
                      Chief Complaint
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {record.chief_complaint}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
                      Diagnosis
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {record.diagnosis}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full my-8 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Medical Record Details
                </h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close modal"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Full record details - similar to PDF layout */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      Chief Complaint & Diagnosis
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Chief Complaint:</strong>{" "}
                      {selectedRecord.chief_complaint}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      <strong>Diagnosis:</strong> {selectedRecord.diagnosis}
                    </p>
                  </div>

                  {(selectedRecord.blood_pressure ||
                    selectedRecord.heart_rate ||
                    selectedRecord.temperature) && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        Vital Signs
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedRecord.blood_pressure && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                              Blood Pressure
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100 font-bold">
                              {selectedRecord.blood_pressure}
                            </p>
                          </div>
                        )}
                        {selectedRecord.heart_rate && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                              Heart Rate
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100 font-bold">
                              {selectedRecord.heart_rate} bpm
                            </p>
                          </div>
                        )}
                        {selectedRecord.temperature && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                              Temperature
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100 font-bold">
                              {selectedRecord.temperature}°F
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRecord.treatment_plan && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                        Treatment Plan
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedRecord.treatment_plan}
                      </p>
                    </div>
                  )}

                  {selectedRecord.recommendations && (
                    <div>
                      <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-2">
                        Recommendations
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedRecord.recommendations}
                      </p>
                    </div>
                  )}

                  {selectedRecord.follow_up_instructions && (
                    <div>
                      <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                        Follow-up Instructions
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedRecord.follow_up_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    downloadAsPDF(selectedRecord);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
