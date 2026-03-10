"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Calendar,
  ClipboardList,
  StickyNote,
  FileUp,
  User,
  Loader2,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { MedicalReportType } from "@/lib/database.types";

interface MedicalReportUploadProps {
  nurseId: string;
}

const REPORT_TYPES: { value: MedicalReportType; label: string }[] = [
  { value: "blood_test", label: "Blood Test" },
  { value: "scan", label: "General Scan" },
  { value: "xray", label: "X-Ray" },
  { value: "mri", label: "MRI Scan" },
  { value: "ct_scan", label: "CT Scan" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "ecg", label: "ECG / EKG" },
  { value: "pathology", label: "Pathology Report" },
  { value: "lab_report", label: "Lab Report" },
  { value: "radiology", label: "Radiology Report" },
  { value: "other", label: "Other" },
];

export function MedicalReportUpload({ nurseId }: MedicalReportUploadProps) {
  const [patientId, setPatientId] = useState("");
  const [reportType, setReportType] = useState<MedicalReportType>("blood_test");
  const [reportName, setReportName] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    validateAndSetFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!patientId || !reportName || !file) {
      setError("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("patientId", patientId);
      formData.append("reportType", reportType);
      formData.append("reportName", reportName);
      formData.append("description", description);
      formData.append("reportDate", reportDate);
      formData.append("notes", notes);
      formData.append("uploadedByUserId", nurseId);
      formData.append("uploadedByRole", "nurse");
      formData.append("file", file);

      const response = await fetch("/api/medical-reports", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setSuccess(true);
      setPatientId("");
      setReportType("blood_test");
      setReportName("");
      setDescription("");
      setNotes("");
      setFile(null);
      setReportDate(new Date().toISOString().split("T")[0]);

      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (["jpg", "jpeg", "png"].includes(ext || "")) return "🖼️";
    if (["dcm", "dicom"].includes(ext || "")) return "🔬";
    return "📎";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-5">
          <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm ring-1 ring-white/30 shadow-lg">
            <FileUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-white">
                Upload Medical Report
              </h2>
            </div>
            <p className="text-green-100 mt-1">
              Securely upload patient diagnostic documents and lab results
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 flex gap-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="rounded-full bg-green-100 p-2 h-fit">
            <CheckCircle className="text-green-600 w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">Upload Successful!</h4>
            <p className="text-sm text-green-700 mt-0.5">
              Medical report has been securely uploaded and is now available in
              the patient record.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5 flex gap-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="rounded-full bg-red-100 p-2 h-fit">
            <AlertCircle className="text-red-600 w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Upload Failed</h4>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Form Header */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-500" />
            Report Details
          </h3>
        </div>

        <div className="p-8 space-y-8">
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                Patient ID <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 pl-12 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                  placeholder="Enter patient ID (e.g., P001)"
                  required
                />
              </div>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                htmlFor="report-type"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                Report Type <span className="text-red-500">*</span>
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) =>
                  setReportType(e.target.value as MedicalReportType)
                }
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 appearance-none bg-white cursor-pointer"
                aria-label="Report Type"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Name */}
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                htmlFor="report-name"
              >
                <FileCheck className="w-4 h-4 text-gray-400" />
                Report Name <span className="text-red-500">*</span>
              </label>
              <input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                placeholder="e.g., Complete Blood Count (CBC)"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                htmlFor="report-date"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                Report Date
              </label>
              <input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                aria-label="Report Date"
              />
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
              htmlFor="description"
            >
              <ClipboardList className="w-4 h-4 text-gray-400" />
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 resize-none"
              placeholder="Brief description of the report contents..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
              htmlFor="notes"
            >
              <StickyNote className="w-4 h-4 text-gray-400" />
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 resize-none"
              placeholder="Any additional notes, observations, or special instructions..."
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Upload className="w-4 h-4 text-gray-400" />
              Upload File <span className="text-red-500">*</span>
            </label>

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 scale-[1.02]"
                    : "border-gray-300 bg-gradient-to-b from-gray-50 to-white hover:border-emerald-400 hover:bg-emerald-50/50"
                }`}
              >
                <label className="flex cursor-pointer flex-col items-center justify-center p-10">
                  <div
                    className={`rounded-2xl p-4 mb-4 transition-all duration-300 ${
                      isDragging ? "bg-emerald-100" : "bg-gray-100"
                    }`}
                  >
                    <Upload
                      className={`w-10 h-10 transition-colors duration-300 ${
                        isDragging ? "text-emerald-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    {isDragging
                      ? "Drop your file here"
                      : "Drag & drop your file here"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse from your computer
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["PDF", "JPG", "PNG", "DICOM"].map((format) => (
                      <span
                        key={format}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 shadow-sm"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Maximum file size: 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom"
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="rounded-xl bg-white p-3 shadow-sm border border-emerald-100">
                      <span className="text-3xl">{getFileIcon()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-0.5">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          Ready to upload
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="rounded-xl p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="Remove file"
                    aria-label="Remove file"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={isUploading || !file || !patientId || !reportName}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 py-4 px-6 font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading Report...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Medical Report</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Files are encrypted and stored securely in compliance with
            healthcare regulations
          </p>
        </div>
      </form>
    </div>
  );
}
