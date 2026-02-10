"use client";

import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  X,
  CheckCircle,
  Pill,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppointmentWithDetails } from "@/lib/database.types";
import { cancelAppointment } from "@/lib/appointments";
import { getAppointmentPrescriptionCount } from "@/lib/prescriptions";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onUpdate: () => void;
}

export default function AppointmentCard({
  appointment,
  onUpdate,
}: AppointmentCardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [prescriptionCount, setPrescriptionCount] = useState<number>(0);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const session = await getSession();
      setUser(session?.user || null);
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function loadPrescriptionCount() {
      const count = await getAppointmentPrescriptionCount(appointment.id);
      setPrescriptionCount(count);
    }
    loadPrescriptionCount();
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

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelAppointment(
      appointment.id,
      appointment.patient_id,
      "Cancelled by patient"
    );
    setCancelling(false);
    if (result.success) {
      setShowCancelConfirm(false);
      onUpdate();
    }
  };

  const handleStartVideoCall = () => {
    // Open Zoom meeting in new tab
    if (appointment.zoom_join_url) {
      window.open(appointment.zoom_join_url, '_blank', 'noopener,noreferrer');
    } else if (appointment.video_call_link) {
      // Fallback to old video_call_link field
      window.open(appointment.video_call_link, '_blank', 'noopener,noreferrer');
    } else {
      alert('Video call link is being generated. Please refresh the page in a moment, or contact your doctor if the issue persists.');
    }
  };

  const isPast =
    new Date(
      appointment.appointment_date + "T" + appointment.appointment_time
    ) < new Date();
  const canCancel = appointment.status === "scheduled" && !isPast;
  // Show video call button for ALL telemedicine appointments
  const canStartCall =
    appointment.is_telemedicine &&
    appointment.status === "scheduled" &&
    !isPast;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-800 transition-all shadow-sm dark:shadow-black/20">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-red-500 dark:text-red-400" />
            Dr. {appointment.doctor_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {appointment.hospital_name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                appointment.status
              )} dark:bg-opacity-20 dark:border-opacity-30`}
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1).replace("_", " ")}
            </span>
            {appointment.is_telemedicine && (
              <span className="px-3 py-1 rounded-full text-xs font-medium border bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                📹 Telemedicine
              </span>
            )}
            {prescriptionCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {prescriptionCount} Medication{prescriptionCount > 1 ? "s" : ""}{" "}
                Prescribed
              </span>
            )}
          </div>
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
            title="Cancel appointment"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{appointment.appointment_time}</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
        <span>{appointment.hospital_name}</span>
      </div>

      {/* Reason */}
      {appointment.reason && (
        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
          <span>{appointment.reason}</span>
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 mb-4">
          <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">Notes:</p>
          <p>{appointment.notes}</p>
        </div>
      )}

      {/* Cancellation Reason */}
      {appointment.cancellation_reason && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-4">
          <p className="font-medium text-red-800 dark:text-red-200 mb-1">Cancellation Reason:</p>
          <p>{appointment.cancellation_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        {canStartCall && (
          <button
            onClick={handleStartVideoCall}
            className="w-full px-4 py-3 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
            </svg>
            🎥 Join Video Call (Zoom)
          </button>
        )}

        {canCancel && (
          <>
            {showCancelConfirm ? (
              <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <span className="text-sm text-red-700 dark:text-red-300">
                  Cancel this appointment?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    No
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
              >
                Cancel Appointment
              </button>
            )}
          </>
        )}
      </div>

      {isPast && appointment.status === "scheduled" && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          Past appointment - no actions available
        </div>
      )}
    </div>
  );
}
