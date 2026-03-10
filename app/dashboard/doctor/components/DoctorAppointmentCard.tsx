"use client";

import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Video,
  Pill,
  Heart,
  MessageSquare,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  ShieldOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppointmentWithDetails } from "@/lib/database.types";
import {
  completeAppointment,
  updateAppointmentStatus,
} from "@/lib/appointments";
import { getAppointmentPrescriptionCount } from "@/lib/prescriptions";
import { hasAppointmentMedicalRecord } from "@/lib/medicalRecords";
import { logAction } from "@/lib/logging";
import { getSession } from "@/lib/auth";
import { useState, useEffect } from "react";
import { NurseAssignment } from "./NurseAssignment";
import PatientProfileModal from "@/components/PatientProfileModal";
import VitalsViewer from "./VitalsViewer";
import Portal from "@/components/ui/Portal";

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
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [showConfirmNoShow, setShowConfirmNoShow] = useState(false);
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

  const handleViewVitals = async () => {
    if (!appointment.share_health_profile) {
      alert(
        "Access Denied: Patient has not consented to share their health data based on HIPAA rules.",
      );
      return;
    }
    const session = await getSession();
    if (session?.user?.doctor_id) {
      await logAction({
        userId: session.user.doctor_id,
        userRole: "doctor",
        action: "view_patient_vitals",
        resourceType: "patient_vitals",
        resourceId: appointment.patient_id,
        details: `Doctor viewed vitals for patient ${appointment.patient_name}`,
      });
    }
    setShowVitalsModal(true);
  };

  const handleViewProfile = async () => {
    if (!appointment.share_health_profile) {
      alert(
        "Access Denied: Patient has not consented to share their health data based on HIPAA rules.",
      );
      return;
    }
    const session = await getSession();
    if (session?.user?.doctor_id) {
      await logAction({
        userId: session.user.doctor_id,
        userRole: "doctor",
        action: "view_patient_profile",
        resourceType: "patient_profile",
        resourceId: appointment.patient_id,
        details: `Doctor viewed profile for patient ${appointment.patient_name}`,
      });
    }
    setShowProfileModal(true);
  };

  const handleComplete = async () => {
    setUpdating(true);
    const result = await completeAppointment(appointment.id, doctorId);
    setUpdating(false);
    if (result.success) {
      setShowConfirmComplete(false);
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
      "Patient did not show up",
    );
    setUpdating(false);
    if (result.success) {
      setShowConfirmNoShow(false);
      onUpdate();
    } else {
      alert(`Error marking no-show: ${result.error || "Unknown error"}`);
    }
  };

  const isScheduled = appointment.status === "scheduled";
  const isCompleted = appointment.status === "completed";
  const appointmentDate = new Date(
    appointment.appointment_date + "T" + appointment.appointment_time,
  );
  const isToday = new Date().toDateString() === appointmentDate.toDateString();
  const showMedicalRecordButton =
    Boolean(onCreateMedicalRecord) && (isToday || isCompleted);
  const canChat = isScheduled || isCompleted;

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "no_show":
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  return (
    <>
      {/* Compact Card */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-300 ${
          isExpanded
            ? "border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
        }`}
      >
        {/* Clickable Header - Always Visible */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-4 p-4 cursor-pointer select-none"
        >
          {/* Patient Avatar */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            {(appointment.patient_name || "P").charAt(0).toUpperCase()}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {appointment.patient_name}
              </h3>
              {appointment.patient_id_string && (
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono rounded">
                  {appointment.patient_id_string}
                </span>
              )}
              {/* Consent Badge */}
              {appointment.share_health_profile ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded">
                  <Shield className="w-3 h-3" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                  <ShieldOff className="w-3 h-3" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {appointment.appointment_time}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(appointment.appointment_date).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  },
                )}
              </span>
              {appointment.is_telemedicine && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Video className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Right Side - Status & Expand */}
          <div className="flex items-center gap-3">
            {isToday && isScheduled && (
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                Today
              </span>
            )}
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyles(appointment.status)}`}
            >
              {appointment.status.replace("_", " ").toUpperCase()}
            </span>
            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 space-y-3">
              {/* Quick Info Row */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {appointment.hospital_name}
                </span>
                {appointment.nurse_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Nurse: {appointment.nurse_name}
                  </span>
                )}
              </div>

              {/* Reason */}
              {appointment.reason && (
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Reason:{" "}
                  </span>
                  {appointment.reason}
                </p>
              )}

              {/* Consent Warning */}
              {!appointment.share_health_profile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Patient has not authorized data sharing (HIPAA §164.508)
                  </span>
                </div>
              )}

              {/* Nurse Assignment - Always show for scheduled appointments */}
              {isScheduled && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                  <NurseAssignment
                    appointmentId={appointment.id}
                    currentNurseId={appointment.nurse_id}
                    currentNurseName={appointment.nurse_name}
                    department={appointment.specialization || "General"}
                    hospitalId={appointment.hospital_id}
                    onUpdate={onUpdate}
                  />
                </div>
              )}

              {/* Patient Health Info - Compact */}
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <Heart className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                  Health Info
                </span>
                <button
                  onClick={handleViewVitals}
                  disabled={!appointment.share_health_profile}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    appointment.share_health_profile
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Vitals
                </button>
                <button
                  onClick={handleViewProfile}
                  disabled={!appointment.share_health_profile}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    appointment.share_health_profile
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Profile
                </button>
              </div>

              {/* Action Buttons - Compact Row */}
              {(isScheduled || isCompleted) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Chat */}
                  {canChat && (
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/doctor/appointments/${appointment.id}/chat`,
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  )}

                  {/* Video Call */}
                  {isScheduled &&
                    appointment.is_telemedicine &&
                    onStartVideoCall && (
                      <button
                        onClick={onStartVideoCall}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Video
                      </button>
                    )}

                  {/* Prescribe */}
                  {isScheduled &&
                    onPrescribe &&
                    (appointment.is_telemedicine || isToday) && (
                      <button
                        onClick={onPrescribe}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          prescriptionCount > 0
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {prescriptionCount > 0 ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Pill className="w-3.5 h-3.5" />
                        )}
                        {prescriptionCount > 0 ? "Prescribed" : "Prescribe"}
                      </button>
                    )}

                  {/* Medical Record */}
                  {showMedicalRecordButton && (
                    <button
                      onClick={
                        hasMedicalRecord ? undefined : onCreateMedicalRecord
                      }
                      disabled={hasMedicalRecord}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                        hasMedicalRecord
                          ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-default"
                          : "bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      }`}
                    >
                      {hasMedicalRecord ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      {hasMedicalRecord ? "Record Created" : "Medical Record"}
                    </button>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Complete / No Show */}
                  {isScheduled &&
                    !showConfirmComplete &&
                    !showConfirmNoShow && (
                      <>
                        <button
                          onClick={() => setShowConfirmComplete(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-lg transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete
                        </button>
                        <button
                          onClick={() => setShowConfirmNoShow(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          No Show
                        </button>
                      </>
                    )}
                </div>
              )}

              {/* Confirm Complete */}
              {showConfirmComplete && (
                <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Mark as completed?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmComplete(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={updating}
                      className="px-2.5 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                    >
                      {updating ? "..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm No Show */}
              {showConfirmNoShow && (
                <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Mark as no-show?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmNoShow(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNoShow}
                      disabled={updating}
                      className="px-2.5 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50"
                    >
                      {updating ? "..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      {showProfileModal && (
        <PatientProfileModal
          patientId={appointment.patient_id}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Vitals Modal */}
      {showVitalsModal && (
        <Portal>
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Patient Vitals - {appointment.patient_name}
                </h2>
                <button
                  onClick={() => setShowVitalsModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Close vitals modal"
                >
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <VitalsViewer
                  patientId={appointment.patient_id}
                  patientName={appointment.patient_name}
                />
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
