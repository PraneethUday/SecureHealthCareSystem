"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { MedicalReportType } from "@/lib/database.types";

interface MedicalReportsViewerProps {
  doctorId: string;
}

const REPORT_TYPE_LABELS: Record<MedicalReportType, string> = {
  blood_test: "Blood Test",
  scan: "General Scan",
  xray: "X-Ray",
  mri: "MRI Scan",
  ct_scan: "CT Scan",
  ultrasound: "Ultrasound",
  ecg: "ECG/EKG",
  pathology: "Pathology Report",
  lab_report: "Lab Report",
  radiology: "Radiology Report",
  other: "Other",
};

const REPORT_TYPE_COLORS: Record<MedicalReportType, string> = {
  blood_test: "bg-red-50 text-red-700 border-red-200",
  scan: "bg-purple-50 text-purple-700 border-purple-200",
  xray: "bg-blue-50 text-blue-700 border-blue-200",
  mri: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ct_scan: "bg-violet-50 text-violet-700 border-violet-200",
  ultrasound: "bg-cyan-50 text-cyan-700 border-cyan-200",
  ecg: "bg-pink-50 text-pink-700 border-pink-200",
  pathology: "bg-orange-50 text-orange-700 border-orange-200",
  lab_report: "bg-yellow-50 text-yellow-700 border-yellow-200",
  radiology: "bg-teal-50 text-teal-700 border-teal-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

export function MedicalReportsViewer({ doctorId }: MedicalReportsViewerProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchPatientId, setSearchPatientId] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      const params = new URLSearchParams();
      // Always include doctorId to enforce appointment-based access control
      params.append("doctorId", doctorId);
      if (searchPatientId) {
        params.append("patientId", searchPatientId);
      }
      if (reportTypeFilter !== "all") {
        params.append("reportType", reportTypeFilter);
      }

      const response = await fetch(`/api/medical-reports?${params}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.accessDenied) {
          setAccessDenied(true);
          setError(result.error);
          setReports([]);
          setFilteredReports([]);
          return;
        }
        throw new Error(result.error || "Failed to fetch reports");
      }

      setReports(result.reports || []);
      setFilteredReports(result.reports || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchReports();
  };

  const handleViewReport = async (report: any) => {
    // Log the view action
    try {
      await fetch("/api/medical-reports/log-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          userId: doctorId,
          userRole: "doctor",
        }),
      });
    } catch (err) {
      console.error("Failed to log view:", err);
    }

    // Open the file in a new tab
    window.open(report.file_url, "_blank");
  };

  const handleDownloadReport = async (report: any) => {
    // Log the download action
    try {
      await fetch("/api/medical-reports/log-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          userId: doctorId,
          userRole: "doctor",
        }),
      });
    } catch (err) {
      console.error("Failed to log download:", err);
    }

    // Download the file - file_url already contains signed URL from API
    const link = document.createElement("a");
    link.href = report.file_url;
    link.download = report.file_name;
    link.target = "_blank"; // Open in new tab for better UX
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Patient Medical Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and download test results for patients who have booked
            appointments with you
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchPatientId}
            onChange={(e) => setSearchPatientId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by Patient ID (e.g., P001)"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            aria-label="Filter by report type"
          >
            <option value="all">All Types</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error Message */}
      {error && !accessDenied && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">
              Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Access Denied Message */}
      {accessDenied && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-300">
              Access Restricted
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              You can only view medical reports for patients who have booked an
              appointment with you.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
              The patient <span className="font-medium">{searchPatientId}</span>{" "}
              has not booked any appointments with you.
            </p>
          </div>
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading reports...
          </p>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {filteredReports.length} report
            {filteredReports.length !== 1 ? "s" : ""} found
          </p>

          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Report Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {report.report_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                              REPORT_TYPE_COLORS[
                                report.report_type as MedicalReportType
                              ]
                            }`}
                          >
                            {
                              REPORT_TYPE_LABELS[
                                report.report_type as MedicalReportType
                              ]
                            }
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatFileSize(report.file_size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {report.patient_name}{" "}
                          <span className="text-slate-400">
                            ({report.patient_id})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {new Date(report.report_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        {report.description}
                      </p>
                    )}

                    {/* Notes */}
                    {report.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg px-3 py-2 mb-2">
                        <p className="text-xs text-amber-800 dark:text-amber-400">
                          <span className="font-medium">Notes:</span>{" "}
                          {report.notes}
                        </p>
                      </div>
                    )}

                    {/* Upload Info */}
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Uploaded {new Date(report.uploaded_at).toLocaleString()}{" "}
                      by {report.uploaded_by_role}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      title="Download Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !accessDenied && filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            No Reports Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
            {searchPatientId
              ? "No reports found for this patient. Try adjusting your search criteria."
              : "Enter a patient ID to search for their medical reports. You can only view reports for patients who have booked appointments with you."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
