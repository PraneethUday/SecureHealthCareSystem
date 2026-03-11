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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
          <FileUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Upload Medical Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Securely upload patient diagnostic documents and lab results
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex gap-3 items-start">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-emerald-900 dark:text-emerald-300 text-sm">
              Upload Successful!
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              Medical report has been securely uploaded and is now available in the patient record.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex gap-3 items-start">
          <AlertCircle className="text-red-600 dark:text-red-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-900 dark:text-red-300 text-sm">
              Upload Failed
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient ID */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Patient ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Enter patient ID (e.g., P001)"
                required
              />
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as MedicalReportType)
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
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
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <FileCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Report Name <span className="text-red-500">*</span>
            </label>
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="e.g., Complete Blood Count (CBC)"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              aria-label="Report Date"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            placeholder="Brief description of the report contents..."
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <StickyNote className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            placeholder="Any additional notes, observations, or special instructions..."
          />
        </div>

        {/* File Upload */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Upload className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Upload File <span className="text-red-500">*</span>
          </label>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
              }`}
            >
              <label className="flex cursor-pointer flex-col items-center justify-center py-10 px-6">
                <div
                  className={`rounded-xl p-3 mb-3 transition-all duration-200 ${
                    isDragging
                      ? "bg-emerald-100 dark:bg-emerald-800/40"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  <Upload
                    className={`w-7 h-7 transition-colors duration-200 ${
                      isDragging
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isDragging
                    ? "Drop your file here"
                    : "Drag & drop your file here"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  or click to browse from your computer
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["PDF", "JPG", "PNG", "DICOM"].map((format) => (
                    <span
                      key={format}
                      className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[11px] font-medium text-slate-500 dark:text-slate-400"
                    >
                      {format}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
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
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="rounded-lg bg-white dark:bg-slate-800 p-2.5 border border-emerald-100 dark:border-emerald-800">
                    <span className="text-2xl">{getFileIcon()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Ready to upload
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title="Remove file"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2 flex flex-col items-center gap-2">
          <button
            type="submit"
            disabled={isUploading || !file || !patientId || !reportName}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 py-3 px-6 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading Report...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Medical Report
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Files are encrypted and stored securely in compliance with healthcare regulations
          </p>
        </div>
      </form>
    </div>
  );
}
