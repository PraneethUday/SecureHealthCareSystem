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
  blood_test: "bg-red-100 text-red-800 border-red-200",
  scan: "bg-purple-100 text-purple-800 border-purple-200",
  xray: "bg-blue-100 text-blue-800 border-blue-200",
  mri: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ct_scan: "bg-violet-100 text-violet-800 border-violet-200",
  ultrasound: "bg-cyan-100 text-cyan-800 border-cyan-200",
  ecg: "bg-pink-100 text-pink-800 border-pink-200",
  pathology: "bg-orange-100 text-orange-800 border-orange-200",
  lab_report: "bg-yellow-100 text-yellow-800 border-yellow-200",
  radiology: "bg-teal-100 text-teal-800 border-teal-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

export function MedicalReportsViewer({ doctorId }: MedicalReportsViewerProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPatientId, setSearchPatientId] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchPatientId) {
        params.append("patientId", searchPatientId);
      }
      if (reportTypeFilter !== "all") {
        params.append("reportType", reportTypeFilter);
      }

      const response = await fetch(`/api/medical-reports?${params}`);
      const result = await response.json();

      if (!response.ok) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full p-3">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Patient Medical Reports
          </h2>
          <p className="text-sm text-gray-600">
            View and download patient test results and reports
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchPatientId}
              onChange={(e) => setSearchPatientId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by Patient ID (e.g., P001)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {filteredReports.length} report
              {filteredReports.length !== 1 ? "s" : ""}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Report Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {report.report_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${REPORT_TYPE_COLORS[
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
                          <span className="text-sm text-gray-600">
                            {formatFileSize(report.file_size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          <span className="font-medium">Patient:</span>{" "}
                          {report.patient_name} ({report.patient_id})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(report.report_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        {report.description}
                      </p>
                    )}

                    {/* Notes */}
                    {report.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-amber-900">
                          <span className="font-medium">Notes:</span>{" "}
                          {report.notes}
                        </p>
                      </div>
                    )}

                    {/* Upload Info */}
                    <p className="text-xs text-gray-500">
                      Uploaded on{" "}
                      {new Date(report.uploaded_at).toLocaleString()} by{" "}
                      {report.uploaded_by_role}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="View Report"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Download Report"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reports Found
          </h3>
          <p className="text-gray-600">
            {searchPatientId
              ? "No reports found for this patient. Try adjusting your search criteria."
              : "Enter a patient ID to search for their medical reports."}
          </p>
        </div>
      )}
    </div>
  );
}
