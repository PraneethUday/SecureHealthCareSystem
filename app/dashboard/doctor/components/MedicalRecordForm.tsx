"use client";

import { useState } from "react";
import { X, Save, FileText, Activity, Pill, AlertCircle } from "lucide-react";
import { AppointmentWithDetails } from "@/lib/database.types";
import { createMedicalRecord } from "@/lib/medicalRecords";

interface MedicalRecordFormProps {
  appointment: AppointmentWithDetails;
  doctorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MedicalRecordForm({
  appointment,
  doctorId,
  onClose,
  onSuccess,
}: MedicalRecordFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    chief_complaint: "",
    diagnosis: "",
    blood_pressure: "",
    heart_rate: "",
    temperature: "",
    weight: "",
    height: "",
    symptoms: "",
    examination_findings: "",
    treatment_plan: "",
    recommendations: "",
    follow_up_instructions: "",
    lab_results: "",
    test_results: "",
    allergies: "",
    current_medications: "",
    past_medical_history: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chief_complaint || !formData.diagnosis) {
      alert("Please fill in Chief Complaint and Diagnosis");
      return;
    }

    setSubmitting(true);

    const result = await createMedicalRecord(
      {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: doctorId,
        chief_complaint: formData.chief_complaint,
        diagnosis: formData.diagnosis,
        blood_pressure: formData.blood_pressure || undefined,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        symptoms: formData.symptoms || undefined,
        examination_findings: formData.examination_findings || undefined,
        treatment_plan: formData.treatment_plan || undefined,
        recommendations: formData.recommendations || undefined,
        follow_up_instructions: formData.follow_up_instructions || undefined,
        lab_results: formData.lab_results || undefined,
        test_results: formData.test_results || undefined,
        allergies: formData.allergies || undefined,
        current_medications: formData.current_medications || undefined,
        past_medical_history: formData.past_medical_history || undefined,
        notes: formData.notes || undefined,
        record_date: new Date().toISOString().split('T')[0],
      },
      doctorId
    );

    setSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      alert(`Error creating medical record: ${result.error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              Create Medical Record
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {appointment.patient_name} • Date: {new Date(appointment.appointment_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Chief Complaint & Diagnosis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Chief Complaint & Diagnosis
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chief Complaint <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleChange}
                  placeholder="e.g., Persistent headache for 3 days"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  placeholder="Primary diagnosis and any differential diagnoses"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Vital Signs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  name="blood_pressure"
                  value={formData.blood_pressure}
                  onChange={handleChange}
                  placeholder="e.g., 120/80"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  name="heart_rate"
                  value={formData.heart_rate}
                  onChange={handleChange}
                  placeholder="e.g., 72"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="e.g., 98.6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g., 70"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 170"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Clinical Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Patient reported symptoms"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Examination Findings
                </label>
                <textarea
                  name="examination_findings"
                  value={formData.examination_findings}
                  onChange={handleChange}
                  placeholder="Physical examination observations"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Plan
                </label>
                <textarea
                  name="treatment_plan"
                  value={formData.treatment_plan}
                  onChange={handleChange}
                  placeholder="Recommended treatment and interventions"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendations
                </label>
                <textarea
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleChange}
                  placeholder="Lifestyle recommendations, diet, exercise, etc."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Instructions
                </label>
                <textarea
                  name="follow_up_instructions"
                  value={formData.follow_up_instructions}
                  onChange={handleChange}
                  placeholder="When to return, what to monitor, etc."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Lab & Test Results */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Lab & Test Results</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Results
                </label>
                <textarea
                  name="lab_results"
                  value={formData.lab_results}
                  onChange={handleChange}
                  placeholder="Blood tests, urine tests, etc."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Results
                </label>
                <textarea
                  name="test_results"
                  value={formData.test_results}
                  onChange={handleChange}
                  placeholder="X-rays, CT scans, MRI, etc."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Medical History</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="Known allergies"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleChange}
                  placeholder="Medications patient is currently taking"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Past Medical History
                </label>
                <textarea
                  name="past_medical_history"
                  value={formData.past_medical_history}
                  onChange={handleChange}
                  placeholder="Previous conditions, surgeries, hospitalizations"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any other relevant information"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Medical Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
