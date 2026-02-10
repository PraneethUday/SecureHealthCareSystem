"use client";

import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Video,
  Pill,
  Heart,
  Activity,
} from "lucide-react";
import { AppointmentWithDetails } from "@/lib/database.types";
import {
  completeAppointment,
  updateAppointmentStatus,
} from "@/lib/appointments";
import { getAppointmentPrescriptionCount } from "@/lib/prescriptions";
import { hasAppointmentMedicalRecord } from "@/lib/medicalRecords";
import { useState, useEffect } from "react";
import { NurseAssignment } from "./NurseAssignment";
import PatientProfileModal from "@/components/PatientProfileModal";
import VitalsViewer from "./VitalsViewer";

interface DoctorAppointmentCardProps {
  appointment: AppointmentWithDetails;
  doctorId: string;
  onUpdate: () => void;
  onStartVideoCall?: () => void;
  onPrescribe?: () => void;
  onCreateMedicalRecord?: () => void;
}

export default function DoctorAppointmentCard({
  appointment,
  doctorId,
  onUpdate,
  onStartVideoCall,
  onPrescribe,
  onCreateMedicalRecord,
}: DoctorAppointmentCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showMarkComplete, setShowMarkComplete] = useState(false);
  const [showMarkNoShow, setShowMarkNoShow] = useState(false);
  const [prescriptionCount, setPrescriptionCount] = useState<number>(0);
  const [hasMedicalRecord, setHasMedicalRecord] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const count = await getAppointmentPrescriptionCount(appointment.id);
      setPrescriptionCount(count);

      const hasRecord = await hasAppointmentMedicalRecord(appointment.id);
      setHasMedicalRecord(hasRecord);
    }
    loadData();
  }, [appointment.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "no_show":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleComplete = async () => {
    setUpdating(true);
    const result = await completeAppointment(appointment.id, doctorId);
    setUpdating(false);
    if (result.success) {
      setShowMarkComplete(false);
      onUpdate();
    } else {
      alert(`Error completing appointment: ${result.error || "Unknown error"}`);
    }
  };

  const handleNoShow = async () => {
    setUpdating(true);
    const result = await updateAppointmentStatus(
      appointment.id,
      "no_show",
      doctorId,
      "Patient did not show up"
    );
    setUpdating(false);
    if (result.success) {
      setShowMarkNoShow(false);
      onUpdate();
    } else {
      alert(`Error marking no-show: ${result.error || "Unknown error"}`);
    }
  };

  const isScheduled = appointment.status === "scheduled";
  const isCompleted = appointment.status === "completed";
  const appointmentDate = new Date(
    appointment.appointment_date + "T" + appointment.appointment_time
  );
  const isToday = new Date().toDateString() === appointmentDate.toDateString();
  const showMedicalRecordButton =
    Boolean(onCreateMedicalRecord) && (isToday || isCompleted);
  const medicalRecordButtonDisabled = hasMedicalRecord;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            {appointment.patient_name}
          </h3>
          {isToday && isScheduled && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Today
            </span>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            appointment.status
          )}`}
        >
          {appointment.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {new Date(appointment.appointment_date).toLocaleDateString(
              "en-US",
              {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">
            {appointment.appointment_time}
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
        <span>{appointment.hospital_name}</span>
      </div>

      {/* Nurse Assignment */}
      <div className="mb-4">
        <NurseAssignment
          appointmentId={appointment.id}
          currentNurseId={appointment.nurse_id}
          currentNurseName={appointment.nurse_name}
          department={appointment.specialization || "General"}
          onUpdate={onUpdate}
        />
      </div>

      {/* Reason */}
      {appointment.reason && (
        <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium text-gray-700">Reason: </span>
            <span>{appointment.reason}</span>
          </div>
        </div>
      )}

      {/* Patient Notes */}
      {appointment.notes && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 mb-4">
          <p className="font-medium text-gray-800 mb-1">Patient Notes:</p>
          <p>{appointment.notes}</p>
        </div>
      )}

      {/* Cancellation Reason */}
      {appointment.cancellation_reason && (
        <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 mb-4">
          <p className="font-medium text-red-800 mb-1">Cancellation Reason:</p>
          <p>{appointment.cancellation_reason}</p>
        </div>
      )}

      {/* Patient Health Information - Always Available */}
      <div className="bg-gradient-to-r from-purple-50 to-rose-50 dark:from-purple-900/20 dark:to-rose-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-purple-100 to-rose-100 dark:from-purple-900/30 dark:to-rose-900/30 p-3 rounded-xl flex-shrink-0">
            <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-purple-900 dark:text-purple-200 mb-1">
              Patient Health Information
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
              Access patient vitals, medical profile, and complete health history
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowVitalsModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <Activity className="w-4 h-4" />
                View Vitals
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <User className="w-4 h-4" />
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {(isScheduled || isCompleted) && (
        <div className="pt-4 border-t border-gray-200 space-y-2">
          {isCompleted && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              Appointment marked as completed. Finalize the visit notes below.
            </div>
          )}

          {isScheduled && (
            <>
              {/* Video Call & Prescription buttons for telemedicine */}
              {appointment.is_telemedicine &&
                onStartVideoCall &&
                onPrescribe && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={onStartVideoCall}
                      className="flex items-center justify-center gap-2 px-3 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95 text-sm font-semibold shadow-sm"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Call</span>
                    </button>
                    <button
                      onClick={onPrescribe}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-all active:scale-95 text-sm font-semibold shadow-sm ${prescriptionCount > 0
                        ? "text-white bg-green-600 hover:bg-green-700"
                        : "text-white bg-purple-600 hover:bg-purple-700"
                        }`}
                    >
                      {prescriptionCount > 0 ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Prescribed</span>
                        </>
                      ) : (
                        <>
                          <Pill className="w-4 h-4" />
                          <span>Prescribe</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              {/* For in-person appointments, show prescribe button only */}
              {!appointment.is_telemedicine && isToday && onPrescribe && (
                <button
                  onClick={onPrescribe}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all active:scale-95 text-sm font-semibold mb-4 shadow-sm ${prescriptionCount > 0
                    ? "text-white bg-green-600 hover:bg-green-700"
                    : "text-white bg-purple-600 hover:bg-purple-700"
                    }`}
                >
                  {prescriptionCount > 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Prescribed</span>
                    </>
                  ) : (
                    <>
                      <Pill className="w-4 h-4" />
                      <span>Prescribe</span>
                    </>
                  )}
                </button>
              )}

              {/* Prominent Assign Nurse Button if not assigned */}
              {!appointment.nurse_id && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-orange-900">Nurse Needed</p>
                        <p className="text-xs text-orange-700">No nurse has been assigned yet.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Find the existing NurseAssignment button and click it
                        const id = `nurse-assign-${appointment.id}`;
                        document.getElementById(id)?.click();
                      }}
                      className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      Assign Nurse
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Medical Record Button */}
          {showMedicalRecordButton && (
            <button
              onClick={
                medicalRecordButtonDisabled ? undefined : onCreateMedicalRecord
              }
              disabled={medicalRecordButtonDisabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all active:scale-95 text-sm font-semibold mb-4 shadow-sm border-2 ${medicalRecordButtonDisabled
                ? "text-green-600 bg-green-50 border-green-400 cursor-not-allowed opacity-70"
                : "text-blue-600 bg-blue-50 border-blue-400 hover:bg-blue-100"
                }`}
            >
              {hasMedicalRecord ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Medical Record Ready</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Create Medical Record</span>
                </>
              )}
            </button>
          )}

          {isScheduled &&
            (showMarkComplete ? (
              <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                <span className="text-sm text-green-700">
                  Mark as completed?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMarkComplete(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={updating}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            ) : showMarkNoShow ? (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-700">Mark as no-show?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMarkNoShow(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNoShow}
                    disabled={updating}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowMarkComplete(true)}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all active:scale-95 text-sm font-semibold shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete</span>
                </button>
                <button
                  onClick={() => setShowMarkNoShow(true)}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-all active:scale-95 text-sm font-semibold shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span>No Show</span>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Patient Profile Modal */}
      {showProfileModal && (
        <PatientProfileModal
          patientId={appointment.patient_id}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl p-6 md:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Vitals</h2>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <VitalsViewer
              patientId={appointment.patient_id}
              patientName={appointment.patient_name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
