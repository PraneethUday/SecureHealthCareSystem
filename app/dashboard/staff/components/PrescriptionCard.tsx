"use client";

import { useState } from "react";
import {
  Pill,
  Calendar,
  User,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { markPrescriptionDispensed } from "@/lib/prescriptions";

interface PrescriptionCardProps {
  prescription: {
    id: string;
    patient_id: string;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    doctor_name: string;
    doctor_specialization: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    notes?: string;
    prescribed_date: string;
    start_date: string;
    end_date?: string;
    status: "active" | "completed" | "discontinued";
  };
  staffId: string;
  onStatusUpdate: () => void;
}

export function PrescriptionCard({
  prescription,
  staffId,
  onStatusUpdate,
}: PrescriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispensingNotes, setDispensingNotes] = useState("");
  const [showDispenseForm, setShowDispenseForm] = useState(false);

  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200",
    discontinued: "bg-red-100 text-red-800 border-red-200",
  };

  const statusIcons = {
    active: <AlertCircle className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    discontinued: <AlertCircle className="w-4 h-4" />,
  };

  const handleDispense = async () => {
    setIsDispensing(true);
    try {
      const result = await markPrescriptionDispensed(
        prescription.id,
        staffId,
        dispensingNotes || undefined
      );

      if (result.success) {
        alert("Prescription marked as dispensed successfully!");
        setShowDispenseForm(false);
        setDispensingNotes("");
        onStatusUpdate();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error dispensing prescription:", error);
      alert("Failed to dispense prescription");
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Pill className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {prescription.medication_name}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${
                  statusColors[prescription.status]
                }`}
              >
                {statusIcons[prescription.status]}
                {prescription.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{prescription.patient_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">|</span>
                <span className="font-medium">
                  ID: {prescription.patient_id}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Dosage</p>
            <p className="font-medium text-gray-900">{prescription.dosage}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Frequency</p>
            <p className="font-medium text-gray-900">
              {prescription.frequency}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Duration</p>
            <p className="font-medium text-gray-900">{prescription.duration}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Prescribed Date</p>
            <p className="font-medium text-gray-900">
              {new Date(prescription.prescribed_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            {/* Doctor Information */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Prescribed By</p>
              <p className="font-medium text-gray-900">
                {prescription.doctor_name}
              </p>
              <p className="text-sm text-gray-600">
                {prescription.doctor_specialization}
              </p>
            </div>

            {/* Patient Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Patient Email</p>
                <p className="text-sm text-gray-900">
                  {prescription.patient_email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Patient Phone</p>
                <p className="text-sm text-gray-900">
                  {prescription.patient_phone || "N/A"}
                </p>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(prescription.start_date).toLocaleDateString()}
                </p>
              </div>
              {prescription.end_date && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">End Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(prescription.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            {prescription.instructions && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Instructions
                </p>
                <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-md">
                  {prescription.instructions}
                </p>
              </div>
            )}

            {/* Notes */}
            {prescription.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Notes
                </p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                  {prescription.notes}
                </p>
              </div>
            )}

            {/* Dispense Action */}
            {prescription.status === "active" && (
              <div className="pt-4 border-t border-gray-200">
                {!showDispenseForm ? (
                  <button
                    onClick={() => setShowDispenseForm(true)}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Dispensed
                  </button>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={dispensingNotes}
                      onChange={(e) => setDispensingNotes(e.target.value)}
                      placeholder="Add dispensing notes (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDispense}
                        disabled={isDispensing}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDispensing ? "Dispensing..." : "Confirm Dispense"}
                      </button>
                      <button
                        onClick={() => {
                          setShowDispenseForm(false);
                          setDispensingNotes("");
                        }}
                        disabled={isDispensing}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
