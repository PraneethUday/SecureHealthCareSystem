'use client';

import { Calendar, Clock, MapPin, User, FileText, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { AppointmentWithDetails } from '@/lib/database.types';
import { completeAppointment, updateAppointmentStatus } from '@/lib/appointments';
import { useState } from 'react';

interface DoctorAppointmentCardProps {
  appointment: AppointmentWithDetails;
  doctorId: string;
  onUpdate: () => void;
}

export default function DoctorAppointmentCard({ appointment, doctorId, onUpdate }: DoctorAppointmentCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showMarkComplete, setShowMarkComplete] = useState(false);
  const [showMarkNoShow, setShowMarkNoShow] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleComplete = async () => {
    setUpdating(true);
    const result = await completeAppointment(appointment.id, doctorId);
    setUpdating(false);
    if (result.success) {
      setShowMarkComplete(false);
      onUpdate();
    }
  };

  const handleNoShow = async () => {
    setUpdating(true);
    const result = await updateAppointmentStatus(
      appointment.id,
      'no_show',
      doctorId,
      'Patient did not show up'
    );
    setUpdating(false);
    if (result.success) {
      setShowMarkNoShow(false);
      onUpdate();
    }
  };

  const isScheduled = appointment.status === 'scheduled';
  const appointmentDate = new Date(appointment.appointment_date + 'T' + appointment.appointment_time);
  const isToday = new Date().toDateString() === appointmentDate.toDateString();

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
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{appointment.appointment_time}</span>
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

      {/* Actions */}
      {isScheduled && (
        <div className="pt-4 border-t border-gray-200 space-y-2">
          {showMarkComplete ? (
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
              <span className="text-sm text-green-700">Mark as completed?</span>
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
                  {updating ? 'Updating...' : 'Confirm'}
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
                  {updating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowMarkComplete(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
              <button
                onClick={() => setShowMarkNoShow(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                No Show
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
