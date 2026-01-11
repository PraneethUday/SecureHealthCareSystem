"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import { getDoctorAppointments } from "@/lib/appointments";
import { AppointmentWithDetails } from "@/lib/database.types";
import {
  Stethoscope,
  Users,
  Calendar,
  FileText,
  LogOut,
  Loader2,
  Search,
} from "lucide-react";
import DoctorAppointmentCard from "./components/DoctorAppointmentCard";
import { IncomingCallModal } from "./components/IncomingCallModal";
import PrescriptionForm from "./components/PrescriptionForm";
import MedicalRecordForm from "./components/MedicalRecordForm";

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    []
  );
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "past">(
    "today"
  );
  const [
    selectedAppointmentForPrescription,
    setSelectedAppointmentForPrescription,
  ] = useState<AppointmentWithDetails | null>(null);
  const [
    selectedAppointmentForMedicalRecord,
    setSelectedAppointmentForMedicalRecord,
  ] = useState<AppointmentWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [upcomingFilter, setUpcomingFilter] = useState<
    "all" | "telemedicine" | "in_person"
  >("all");
  const [pastFilter, setPastFilter] = useState<
    "all" | "completed" | "cancelled" | "no_show"
  >("all");

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (!session || session.role !== "doctor") {
        router.push("/login");
      } else {
        setUser(session.user);
        // Use the UUID id field, not the TEXT doctor_id field
        const doctorUUID = session.user.id;
        console.log(
          "🔍 Doctor UUID:",
          doctorUUID,
          "| doctor_id (text):",
          session.user.doctor_id
        );
        loadAppointments(doctorUUID);
        // Log dashboard access
        logAction({
          userId: session.user.doctor_id,
          userRole: "doctor",
          action: "dashboard_access",
          details: "Doctor accessed dashboard",
        });
      }
    };
    checkSession();
  }, [router]);

  const loadAppointments = async (doctorId: string) => {
    console.log("📞 Calling getDoctorAppointments with UUID:", doctorId);
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
    (apt) =>
      new Date(apt.appointment_date).toDateString() === today &&
      apt.status === "scheduled"
  );
  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date).toDateString() !== today &&
      new Date(apt.appointment_date + "T" + apt.appointment_time) >=
        new Date() &&
      apt.status === "scheduled"
  );
  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) <
        new Date() ||
      apt.status === "completed" ||
      apt.status === "cancelled" ||
      apt.status === "no_show"
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (apt: AppointmentWithDetails) => {
    if (!normalizedSearch) return true;
    const haystack = [apt.patient_name, apt.hospital_name, apt.reason || ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  };

  const filteredTodayAppointments = todayAppointments.filter(matchesSearch);

  const filteredUpcomingAppointments = upcomingAppointments.filter((apt) => {
    if (!matchesSearch(apt)) return false;
    if (upcomingFilter === "telemedicine") {
      return apt.is_telemedicine;
    }
    if (upcomingFilter === "in_person") {
      return !apt.is_telemedicine;
    }
    return true;
  });

  const filteredPastAppointments = pastAppointments.filter((apt) => {
    if (!matchesSearch(apt)) return false;
    if (pastFilter === "all") {
      return true;
    }
    return apt.status === pastFilter;
  });

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
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                My Appointments
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Total: {appointments.length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              {activeTab === "upcoming" && (
                <select
                  aria-label="Filter upcoming appointments"
                  value={upcomingFilter}
                  onChange={(e) =>
                    setUpcomingFilter(
                      e.target.value as "all" | "telemedicine" | "in_person"
                    )
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">All Types</option>
                  <option value="telemedicine">Telemedicine</option>
                  <option value="in_person">In-person</option>
                </select>
              )}
              {activeTab === "past" && (
                <select
                  aria-label="Filter past appointments"
                  value={pastFilter}
                  onChange={(e) =>
                    setPastFilter(
                      e.target.value as
                        | "all"
                        | "completed"
                        | "cancelled"
                        | "no_show"
                    )
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("today")}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === "today"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Today ({filteredTodayAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Upcoming ({filteredUpcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === "past"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Past ({filteredPastAppointments.length})
            </button>
          </div>

          {/* Appointments List */}
          {loadingAppointments ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-500 mt-2">Loading appointments...</p>
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === "today" ? (
                  filteredTodayAppointments.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>
                        {todayAppointments.length === 0
                          ? "No appointments today"
                          : "No appointments match your search"}
                      </p>
                    </div>
                  ) : (
                    filteredTodayAppointments.map((appointment) => (
                      <DoctorAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        doctorId={user.id}
                        onUpdate={() => loadAppointments(user.id)}
                        onStartVideoCall={() => {
                          alert(
                            "Please wait for patient to initiate the video call. You'll receive a notification."
                          );
                        }}
                        onPrescribe={() =>
                          setSelectedAppointmentForPrescription(appointment)
                        }
                        onCreateMedicalRecord={() =>
                          setSelectedAppointmentForMedicalRecord(appointment)
                        }
                      />
                    ))
                  )
                ) : activeTab === "upcoming" ? (
                  filteredUpcomingAppointments.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>
                        {upcomingAppointments.length === 0
                          ? "No upcoming appointments"
                          : "No appointments match your filters"}
                      </p>
                    </div>
                  ) : (
                    filteredUpcomingAppointments.map((appointment) => (
                      <DoctorAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        doctorId={user.id}
                        onUpdate={() => loadAppointments(user.id)}
                        onStartVideoCall={() => {
                          alert(
                            "Please wait for patient to initiate the video call. You'll receive a notification."
                          );
                        }}
                        onPrescribe={() =>
                          setSelectedAppointmentForPrescription(appointment)
                        }
                        onCreateMedicalRecord={() =>
                          setSelectedAppointmentForMedicalRecord(appointment)
                        }
                      />
                    ))
                  )
                ) : filteredPastAppointments.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>
                      {pastAppointments.length === 0
                        ? "No past appointments"
                        : "No appointments match your filters"}
                    </p>
                  </div>
                ) : (
                  filteredPastAppointments.map((appointment) => (
                    <DoctorAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      doctorId={user.id}
                      onUpdate={() => loadAppointments(user.id)}
                      onStartVideoCall={() => {
                        alert(
                          "Please wait for patient to initiate the video call. You'll receive a notification."
                        );
                      }}
                      onPrescribe={() =>
                        setSelectedAppointmentForPrescription(appointment)
                      }
                      onCreateMedicalRecord={() =>
                        setSelectedAppointmentForMedicalRecord(appointment)
                      }
                    />
                  ))
                )}
              </div>
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

      {/* Incoming Call Modal - Only render when user is loaded */}
      {user && (
        <IncomingCallModal
          doctorId={user.id}
          onCallAccepted={(call) => {
            console.log("[Dashboard] Call accepted, navigating to call page");
            router.push(`/dashboard/call/${call.id}`);
          }}
          onCallRejected={(callId) => {
            console.log("[Dashboard] Call rejected:", callId);
          }}
        />
      )}

      {/* Prescription Modal */}
      {selectedAppointmentForPrescription && (
        <PrescriptionForm
          appointment={selectedAppointmentForPrescription}
          doctorId={user.id}
          onClose={() => setSelectedAppointmentForPrescription(null)}
          onSuccess={() => {
            setSelectedAppointmentForPrescription(null);
            loadAppointments(user.id);
            alert("Prescription issued successfully!");
          }}
        />
      )}

      {/* Medical Record Modal */}
      {selectedAppointmentForMedicalRecord && (
        <MedicalRecordForm
          appointment={selectedAppointmentForMedicalRecord}
          doctorId={user.id}
          onClose={() => setSelectedAppointmentForMedicalRecord(null)}
          onSuccess={() => {
            setSelectedAppointmentForMedicalRecord(null);
            loadAppointments(user.id);
            alert("Medical record created successfully!");
          }}
        />
      )}
    </div>
  );
}
