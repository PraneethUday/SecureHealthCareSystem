"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Search,
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
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const clearFile = () => {
    setFile(null);
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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

      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-lg text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Upload Medical Report</h2>
            <p className="text-sm text-white/90">
              Securely upload patient diagnostic documents
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3">
          <CheckCircle className="text-green-600 w-5 h-5 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Upload Successful</h4>
            <p className="text-sm text-green-700">
              Medical report uploaded successfully.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="text-red-600 w-5 h-5 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 p-8 space-y-8"
      >
        {/* Patient ID */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Patient ID <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500"
              placeholder="P001"
              required
            />
          </div>
        </div>

        {/* Report Type */}
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="report-type">
            Report Type *
          </label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as MedicalReportType)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
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
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="report-name">
            Report Name *
          </label>
          <input
            id="report-name"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
            placeholder="Complete Blood Count (CBC)"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="report-date">
            Report Date
          </label>
          <input
            id="report-date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
            aria-label="Report Date"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the report"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="notes">
            Additional Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes or observations"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Upload File *
          </label>
          {!file ? (
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-6 hover:bg-blue-100 transition">
              <Upload className="w-10 h-10 text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">
                Click or drag file to upload
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom"
                className="hidden"
                onChange={handleFileChange}
                required
              />
            </label>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex gap-3 items-center">
                <FileText className="text-blue-600 w-7 h-7" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button type="button" onClick={clearFile} title="Remove file" aria-label="Remove file">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-semibold text-white shadow-md hover:opacity-90 transition disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload Medical Report"}
        </button>
      </form>
    </div>
  );
}
