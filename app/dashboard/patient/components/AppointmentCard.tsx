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
import { AppointmentWithDetails } from "@/lib/database.types";
import { cancelAppointment } from "@/lib/appointments";
import { getAppointmentPrescriptionCount } from "@/lib/prescriptions";
import { useState, useEffect } from "react";

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onUpdate: () => void;
}

export default function AppointmentCard({
  appointment,
  onUpdate,
}: AppointmentCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [prescriptionCount, setPrescriptionCount] = useState<number>(0);

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

  const isPast =
    new Date(
      appointment.appointment_date + "T" + appointment.appointment_time
    ) < new Date();
  const canCancel = appointment.status === "scheduled" && !isPast;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-red-300 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-red-500" />
            Dr. {appointment.doctor_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {appointment.hospital_name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                appointment.status
              )}`}
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1).replace("_", " ")}
            </span>
            {prescriptionCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200 flex items-center gap-1.5">
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
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Cancel appointment"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
          <span className="text-sm">{appointment.appointment_time}</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
        <span>{appointment.hospital_name}</span>
      </div>

      {/* Reason */}
      {appointment.reason && (
        <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
          <span>{appointment.reason}</span>
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-4">
          <p className="font-medium text-gray-800 mb-1">Notes:</p>
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

      {/* Actions */}
      {canCancel && (
        <div className="pt-4 border-t border-gray-200">
          {showCancelConfirm ? (
            <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
              <span className="text-sm text-red-700">
                Cancel this appointment?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
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
              className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Cancel Appointment
            </button>
          )}
        </div>
      )}

      {isPast && appointment.status === "scheduled" && (
        <div className="pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
          Past appointment - no actions available
        </div>
      )}
    </div>
  );
}
