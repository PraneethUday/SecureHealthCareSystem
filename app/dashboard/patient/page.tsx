"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import { getPatientAppointments } from "@/lib/appointments";
import { AppointmentWithDetails } from "@/lib/database.types";
import {
  Heart,
  Calendar,
  FileText,
  LogOut,
  User,
  Plus,
  Loader2,
  Pill,
  Search,
} from "lucide-react";
import AppointmentCard from "./components/AppointmentCard";
import NewAppointmentForm from "./components/NewAppointmentForm";
import PrescriptionsList from "./components/PrescriptionsList";
import MedicalRecordsList from "./components/MedicalRecordsList";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    []
  );
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "appointments" | "prescriptions" | "records"
  >("appointments");
  const [appointmentSubTab, setAppointmentSubTab] = useState<
    "upcoming" | "past"
  >("upcoming");
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [upcomingAppointmentFilter, setUpcomingAppointmentFilter] = useState<
    "all" | "telemedicine" | "in_person"
  >("all");
  const [pastAppointmentFilter, setPastAppointmentFilter] = useState<
    "all" | "completed" | "cancelled" | "no_show"
  >("all");

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "patient") {
      router.push("/login");
    } else {
      setUser(session.user);
      loadAppointments(session.user.id);
      // Log dashboard access
      logAction({
        userId: session.user.patient_id || session.user.email,
        userRole: "patient",
        action: "dashboard_access",
        details: "Patient accessed dashboard",
      });
    }
  }, [router]);

  const loadAppointments = async (patientId: string) => {
    setLoadingAppointments(true);
    const data = await getPatientAppointments(patientId);
    setAppointments(data);
    setLoadingAppointments(false);
  };

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.patient_id || user.email,
        userRole: "patient",
        action: "logout",
        details: "Patient logged out",
      });
    }
    clearSession();
    router.push("/login");
  };

  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) >=
        new Date() && apt.status === "scheduled"
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) <
        new Date() || apt.status !== "scheduled"
  );

  const normalizedAppointmentSearch = appointmentSearchTerm
    .trim()
    .toLowerCase();
  const matchesAppointmentSearch = (apt: AppointmentWithDetails) => {
    if (!normalizedAppointmentSearch) {
      return true;
    }
    const haystack = [
      apt.patient_name,
      apt.doctor_name || "",
      apt.hospital_name || "",
      apt.reason || "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedAppointmentSearch);
  };

  const filteredUpcomingAppointments = upcomingAppointments.filter((apt) => {
    if (!matchesAppointmentSearch(apt)) {
      return false;
    }
    if (upcomingAppointmentFilter === "telemedicine") {
      return apt.is_telemedicine;
    }
    if (upcomingAppointmentFilter === "in_person") {
      return !apt.is_telemedicine;
    }
    return true;
  });

  const filteredPastAppointments = pastAppointments.filter((apt) => {
    if (!matchesAppointmentSearch(apt)) {
      return false;
    }
    if (pastAppointmentFilter === "all") {
      return true;
    }
    return apt.status === pastAppointmentFilter;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-full p-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Patient Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.first_name} {user.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Health Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">
                {user.phone_number || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">
                {user.date_of_birth || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="font-medium">{user.patient_id}</p>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-red-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-6 border-b border-gray-200 w-full">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`pb-3 px-2 font-semibold transition-colors text-base ${
                  activeTab === "appointments"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("prescriptions")}
                className={`pb-3 px-2 font-semibold transition-colors text-base ${
                  activeTab === "prescriptions"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Pill className="w-5 h-5 inline mr-2" />
                Prescriptions
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`pb-3 px-2 font-semibold transition-colors text-base ${
                  activeTab === "records"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Medical Records
              </button>
            </div>
            {activeTab === "appointments" && (
              <button
                onClick={() => setShowNewAppointment(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap ml-4"
              >
                <Plus className="w-4 h-4" />
                Book Appointment
              </button>
            )}
          </div>

          {/* Appointments Tab Content */}
          {activeTab === "appointments" && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appointmentSearchTerm}
                    onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                    placeholder="Search patient or doctor name"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
                {appointmentSubTab === "upcoming" && (
                  <select
                    aria-label="Filter upcoming appointments"
                    value={upcomingAppointmentFilter}
                    onChange={(e) =>
                      setUpcomingAppointmentFilter(
                        e.target.value as "all" | "telemedicine" | "in_person"
                      )
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  >
                    <option value="all">All Types</option>
                    <option value="telemedicine">Telemedicine</option>
                    <option value="in_person">In-person</option>
                  </select>
                )}
                {appointmentSubTab === "past" && (
                  <select
                    aria-label="Filter past appointments"
                    value={pastAppointmentFilter}
                    onChange={(e) =>
                      setPastAppointmentFilter(
                        e.target.value as
                          | "all"
                          | "completed"
                          | "cancelled"
                          | "no_show"
                      )
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                )}
              </div>
              {/* Appointment Sub-Tabs */}
              <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setAppointmentSubTab("upcoming")}
                  className={`pb-2 px-1 font-medium transition-colors ${
                    appointmentSubTab === "upcoming"
                      ? "text-red-600 border-b-2 border-red-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Upcoming ({filteredUpcomingAppointments.length})
                </button>
                <button
                  onClick={() => setAppointmentSubTab("past")}
                  className={`pb-2 px-1 font-medium transition-colors ${
                    appointmentSubTab === "past"
                      ? "text-red-600 border-b-2 border-red-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Past ({filteredPastAppointments.length})
                </button>
              </div>

              {/* Appointments List */}
              {loadingAppointments ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
                  <p className="text-gray-500 mt-2">Loading appointments...</p>
                </div>
              ) : (
                <div className="max-h-[32rem] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointmentSubTab === "upcoming" ? (
                      filteredUpcomingAppointments.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>
                            {upcomingAppointments.length === 0
                              ? "No upcoming appointments"
                              : "No appointments match your search or filters"}
                          </p>
                          {upcomingAppointments.length === 0 && (
                            <button
                              onClick={() => setShowNewAppointment(true)}
                              className="mt-4 text-red-600 hover:underline"
                            >
                              Book your first appointment
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredUpcomingAppointments.map((appointment) => (
                          <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onUpdate={() => loadAppointments(user.id)}
                          />
                        ))
                      )
                    ) : filteredPastAppointments.length === 0 ? (
                      <div className="col-span-2 text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>
                          {pastAppointments.length === 0
                            ? "No past appointments"
                            : "No appointments match your search or filters"}
                        </p>
                      </div>
                    ) : (
                      filteredPastAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onUpdate={() => loadAppointments(user.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Prescriptions Tab Content */}
          {activeTab === "prescriptions" && user && (
            <PrescriptionsList patientId={user.id} />
          )}

          {/* Medical Records Tab Content */}
          {activeTab === "records" && user && (
            <MedicalRecordsList patientId={user.id} />
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100">
            <Calendar className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Appointments
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View and schedule your medical appointments
            </p>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="text-red-600 font-medium text-sm hover:underline"
            >
              Book Appointment →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100">
            <FileText className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Medical Records
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Access your medical history and records
            </p>
            <button
              onClick={() => setActiveTab("records")}
              className="text-red-600 font-medium text-sm hover:underline"
            >
              View Records →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100">
            <User className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Profile Settings
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Update your personal information
            </p>
            <button className="text-red-600 font-medium text-sm hover:underline">
              Edit Profile →
            </button>
          </div>
        </div>
      </main>

      {/* New Appointment Form Modal */}
      {showNewAppointment && (
        <NewAppointmentForm
          patientId={user.id}
          onClose={() => setShowNewAppointment(false)}
          onSuccess={() => {
            setShowNewAppointment(false);
            loadAppointments(user.id);
          }}
        />
      )}
    </div>
  );
}
