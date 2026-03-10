"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import ChatWindow from "@/app/dashboard/components/ChatWindow";
import { getSession } from "@/lib/auth";

interface AppointmentDetails {
  id: string;
  doctor_id: string;
  patient_id: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

export default function PatientChatPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null,
  );
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user session
      const session = await getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Check role from session.role (not session.user.role)
      if (session.role !== "patient") {
        router.push(`/dashboard/${session.role}`);
        return;
      }

      // Fetch appointment details
      const response = await fetch(`/api/appointments?id=${appointmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment details");
      }

      const data = await response.json();
      if (!data.appointment) {
        throw new Error("Appointment not found");
      }

      // Verify this is the patient's appointment
      if (data.appointment.patient_id !== session.user.id) {
        throw new Error("You are not authorized to access this chat");
      }

      setAppointment({
        id: data.appointment.id,
        doctor_id: data.appointment.doctor_id,
        patient_id: data.appointment.patient_id,
        doctor_name: data.appointment.doctor_name || "Doctor",
        appointment_date: data.appointment.appointment_date,
        appointment_time: data.appointment.appointment_time,
        status: data.appointment.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [appointmentId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !appointment || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Chat
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || "Something went wrong"}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Appointments</span>
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Dr. {appointment.doctor_name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(
                      appointment.appointment_date,
                    ).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {appointment.appointment_time}
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  appointment.status === "scheduled"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : appointment.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <ChatWindow
          appointmentId={appointmentId}
          currentUserId={user.id}
          currentUserRole="patient"
          otherUserName={`Dr. ${appointment.doctor_name}`}
        />
      </div>
    </div>
  );
}
