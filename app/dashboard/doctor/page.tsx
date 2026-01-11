"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import { getDoctorAppointments } from "@/lib/appointments";
import { AppointmentWithDetails } from "@/lib/database.types";
import { Stethoscope, Users, Calendar, FileText, LogOut, Loader2 } from "lucide-react";
import DoctorAppointmentCard from "./components/DoctorAppointmentCard";

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "doctor") {
      router.push("/login");
    } else {
      setUser(session.user);
      loadAppointments(session.user.id);
      // Log dashboard access
      logAction({
        userId: session.user.doctor_id,
        userRole: "doctor",
        action: "dashboard_access",
        details: "Doctor accessed dashboard",
      });
    }
  }, [router]);

  const loadAppointments = async (doctorId: string) => {
    setLoadingAppointments(true);
    const data = await getDoctorAppointments(doctorId);
    setAppointments(data);
    setLoadingAppointments(false);
  };

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.doctor_id,
        userRole: "doctor",
        action: "logout",
        details: "Doctor logged out",
      });
    }
    clearSession();
    router.push("/login");
  };

  const today = new Date().toDateString();
  const todayAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date).toDateString() === today && apt.status === 'scheduled'
  );
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date).toDateString() !== today &&
            new Date(apt.appointment_date + 'T' + apt.appointment_time) >= new Date() &&
            apt.status === 'scheduled'
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date + 'T' + apt.appointment_time) < new Date() ||
            apt.status !== 'scheduled'
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full p-2">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Doctor Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Dr. {user.first_name} {user.last_name} - {user.specialization}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Professional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Doctor ID</p>
              <p className="font-medium">{user.doctor_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{user.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">License Number</p>
              <p className="font-medium">{user.license_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Experience</p>
              <p className="font-medium">{user.years_of_experience} years</p>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">My Appointments</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Total: {appointments.length}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'today'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Today ({todayAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Past ({pastAppointments.length})
            </button>
          </div>

          {/* Appointments List */}
          {loadingAppointments ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-500 mt-2">Loading appointments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === 'today' ? (
                todayAppointments.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No appointments today</p>
                  </div>
                ) : (
                  todayAppointments.map((appointment) => (
                    <DoctorAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      doctorId={user.id}
                      onUpdate={() => loadAppointments(user.id)}
                    />
                  ))
                )
              ) : activeTab === 'upcoming' ? (
                upcomingAppointments.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No upcoming appointments</p>
                  </div>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <DoctorAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      doctorId={user.id}
                      onUpdate={() => loadAppointments(user.id)}
                    />
                  ))
                )
              ) : (
                pastAppointments.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No past appointments</p>
                  </div>
                ) : (
                  pastAppointments.map((appointment) => (
                    <DoctorAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      doctorId={user.id}
                      onUpdate={() => loadAppointments(user.id)}
                    />
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              My Patients
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View and manage your patient list
            </p>
            <button className="text-blue-600 font-medium text-sm hover:underline">
              View Patients →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Calendar className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Appointments
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage your appointment schedule
            </p>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {todayAppointments.length}
            </div>
            <p className="text-xs text-gray-500">appointments today</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <FileText className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Medical Records
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Access patient medical records
            </p>
            <button className="text-blue-600 font-medium text-sm hover:underline">
              View Records →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
