"use client";

import { useState } from "react";
import { X, Pill, Plus, Loader2 } from "lucide-react";
import { createPrescription } from "@/lib/prescriptions";
import { AppointmentWithDetails } from "@/lib/database.types";

interface PrescriptionFormProps {
  appointment: AppointmentWithDetails;
  doctorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrescriptionForm({
  appointment,
  doctorId,
  onClose,
  onSuccess,
}: PrescriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prescriptions, setPrescriptions] = useState([
    {
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);
  const [notes, setNotes] = useState("");

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medication_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    const validPrescriptions = prescriptions.filter(
      (p) => p.medication_name && p.dosage && p.frequency && p.duration
    );

    if (validPrescriptions.length === 0) {
      setError("Please add at least one complete prescription");
      return;
    }

    setLoading(true);

    // Create all prescriptions
    const results = await Promise.all(
      validPrescriptions.map((prescription) =>
        createPrescription(
          {
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            doctor_id: doctorId,
            ...prescription,
            notes: notes,
            prescribed_date: new Date().toISOString().split("T")[0],
            start_date: new Date().toISOString().split("T")[0],
            status: "active",
          },
          doctorId
        )
      )
    );

    setLoading(false);

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      setError(`Failed to create ${failed.length} prescription(s)`);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Pill className="w-6 h-6 text-blue-600" />
              E-Prescription
            </h2>
            <p className="text-sm text-gray-500">
              Patient: {appointment.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"            aria-label="Close prescription form"          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Appointment Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Date:</span>{" "}
                <span className="font-medium">
                  {new Date(appointment.appointment_date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>{" "}
                <span className="font-medium">{appointment.appointment_time}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Reason:</span>{" "}
                <span className="font-medium">{appointment.reason || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          <div className="space-y-4 mb-6">
            {prescriptions.map((prescription, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-4 relative"
              >
                {prescriptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrescription(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    aria-label="Remove prescription"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                <h4 className="font-semibold text-gray-700 mb-3">
                  Medication #{index + 1}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      value={prescription.medication_name}
                      onChange={(e) =>
                        updatePrescription(index, "medication_name", e.target.value)
                      }
                      placeholder="e.g., Amoxicillin"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={prescription.dosage}
                      onChange={(e) =>
                        updatePrescription(index, "dosage", e.target.value)
                      }
                      placeholder="e.g., 500mg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      value={prescription.frequency}
                      onChange={(e) =>
                        updatePrescription(index, "frequency", e.target.value)
                      }
                      placeholder="e.g., Twice daily"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={prescription.duration}
                      onChange={(e) =>
                        updatePrescription(index, "duration", e.target.value)
                      }
                      placeholder="e.g., 7 days, 2 weeks"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions (Optional)
                    </label>
                    <textarea
                      value={prescription.instructions}
                      onChange={(e) =>
                        updatePrescription(index, "instructions", e.target.value)
                      }
                      placeholder="e.g., Take with food, Avoid alcohol"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPrescription}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Medication
            </button>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional instructions or notes for the patient..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Issue Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
