"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import { getDoctorAppointments } from "@/lib/appointments";
import { AppointmentWithDetails } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import {
  Stethoscope,
  Users,
  Calendar,
  FileText,
  LogOut,
  Loader2,
  Search,
  Files,
  Clock,
  CheckCircle,
} from "lucide-react";
import DoctorAppointmentCard from "./components/DoctorAppointmentCard";
import { IncomingCallModal } from "./components/IncomingCallModal";
import PrescriptionForm from "./components/PrescriptionForm";
import AppointmentsCalendar from "./components/AppointmentsCalendar";
import MedicalRecordForm from "./components/MedicalRecordForm";
import { MedicalReportsViewer } from "./components/MedicalReportsViewer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/app/dashboard/components/NotificationBell";

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    [],
  );
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "today" | "upcoming" | "past" | "reports"
  >("today");
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
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

  // Calculate unique patients from appointments
  const uniquePatients = new Set(appointments.map((apt) => apt.patient_id))
    .size;

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (!session || session.role !== "doctor") {
        router.push("/login");
      } else {
        setUser(session.user);
        const doctorUUID = session.user.id;
        loadAppointments(doctorUUID);
        logAction({
          userId: session.user.doctor_id,
          userRole: "doctor",
          action: "dashboard_access",
        });
      }
    };
    checkSession();
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAppointments = async (doctorId: string) => {
    setLoadingAppointments(true);
    const data = await getDoctorAppointments(doctorId);
    setAppointments(data);
    setLoadingAppointments(false);
  };

  // Fetch pending reports for doctor's patients
  const fetchPendingReports = useCallback(async () => {
    if (appointments.length === 0) return;

    // Get unique patient IDs from appointments
    const patientIds = [...new Set(appointments.map((apt) => apt.patient_id))];

    try {
      // Count reports uploaded in last 7 days that haven't been viewed by doctor
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count, error } = await supabase
        .from("medical_reports")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .gte("uploaded_at", sevenDaysAgo.toISOString());

      if (!error && count !== null) {
        setPendingReportsCount(count);
      }
    } catch (err) {
      console.error("Error fetching pending reports:", err);
    }
  }, [appointments]);

  useEffect(() => {
    fetchPendingReports();
  }, [fetchPendingReports]);

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.doctor_id,
        userRole: "doctor",
        action: "logout",
      });
    }
    clearSession();
    router.push("/login");
  };

  const today = new Date().toDateString();
  const todayAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date).toDateString() === today &&
      apt.status === "scheduled",
  );
  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date).toDateString() !== today &&
      new Date(apt.appointment_date + "T" + apt.appointment_time) >=
        new Date() &&
      apt.status === "scheduled",
  );
  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) <
        new Date() ||
      apt.status === "completed" ||
      apt.status === "cancelled" ||
      apt.status === "no_show",
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
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-blue-100 via-indigo-100 to-sky-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 pb-10 transition-colors duration-500">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 dark:bg-blue-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-cyan-300 dark:bg-cyan-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-gray-800/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-xl p-2.5 shadow-lg shadow-blue-500/20 transform transition-transform hover:scale-105">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Doctor Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Dr. {user.first_name} {user.last_name} • {user.specialization}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900 text-xs text-blue-600 dark:text-blue-400 font-semibold shadow-sm">
                ID: {user.doctor_id}
              </div>
              <NotificationBell userId={user.id} userRole="doctor" />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 active:scale-95 transition-all shadow-sm hover:shadow-md font-medium text-sm group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Stat: Today's Appointments */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md shadow-blue-500/20 text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                Today
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              Appointments
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {todayAppointments.length}
            </p>
          </div>

          {/* Stat: Total Patients */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-xl shadow-md shadow-emerald-500/20 text-white">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              Total Patients
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {uniquePatients}
            </p>
          </div>

          {/* Stat: Pending Reports */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-md shadow-amber-500/20 text-white">
                <Files className="w-6 h-6" />
              </div>
              {pendingReportsCount > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-800">
                  Pending
                </span>
              )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              Reports to Review
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {pendingReportsCount}
            </p>
          </div>

          {/* Appointments Calendar Widget */}
          <AppointmentsCalendar appointments={appointments} />
        </div>

        {/* Main Content Area (Glass Card) */}
        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl overflow-x-auto max-w-full">
              {[
                { id: "today", label: "Today's Schedule", icon: Clock },
                { id: "upcoming", label: "Upcoming", icon: Calendar },
                { id: "past", label: "Past History", icon: Files },
                { id: "reports", label: "Patient Reports", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Bar - Only show for appointment tabs */}
            {activeTab !== "reports" && (
              <div className="mt-4 md:mt-0 relative w-full md:w-64 group">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-200 transition-all shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Tab Content Staging Area */}
          <div className="p-6 md:p-8">
            {activeTab === "reports" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MedicalReportsViewer doctorId={user.doctor_id} />
              </div>
            ) : loadingAppointments ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-400 font-medium">
                  Fetching schedule...
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[600px] overflow-y-auto pr-2 space-y-4">
                {/* Today's Appointments */}
                {activeTab === "today" &&
                  (filteredTodayAppointments.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                      <Calendar className="w-12 h-12 mb-3 opacity-20" />
                      <p>No appointments scheduled for today.</p>
                    </div>
                  ) : (
                    filteredTodayAppointments.map((apt) => (
                      <DoctorAppointmentCard
                        key={apt.id}
                        appointment={apt}
                        doctorId={user.id}
                        onUpdate={() => loadAppointments(user.id)}
                        onStartVideoCall={() => {
                          if (apt.zoom_host_url) {
                            window.open(
                              apt.zoom_host_url,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          } else if (apt.video_call_link) {
                            window.open(
                              apt.video_call_link,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          } else {
                            alert(
                              "Video call link not available yet. Please wait a moment and refresh.",
                            );
                          }
                        }}
                        onPrescribe={() =>
                          setSelectedAppointmentForPrescription(apt)
                        }
                        onCreateMedicalRecord={() =>
                          setSelectedAppointmentForMedicalRecord(apt)
                        }
                      />
                    ))
                  ))}

                {/* Upcoming Appointments */}
                {activeTab === "upcoming" &&
                  (filteredUpcomingAppointments.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                      <Calendar className="w-12 h-12 mb-3 opacity-20" />
                      <p>No upcoming appointments found.</p>
                    </div>
                  ) : (
                    filteredUpcomingAppointments.map((apt) => (
                      <DoctorAppointmentCard
                        key={apt.id}
                        appointment={apt}
                        doctorId={user.id}
                        onUpdate={() => loadAppointments(user.id)}
                        onStartVideoCall={() => {
                          if (apt.zoom_host_url) {
                            window.open(
                              apt.zoom_host_url,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          } else if (apt.video_call_link) {
                            window.open(
                              apt.video_call_link,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          } else {
                            alert(
                              "Video call link not available yet. Please wait a moment and refresh.",
                            );
                          }
                        }}
                        onPrescribe={() =>
                          setSelectedAppointmentForPrescription(apt)
                        }
                        onCreateMedicalRecord={() =>
                          setSelectedAppointmentForMedicalRecord(apt)
                        }
                      />
                    ))
                  ))}

                {/* Past Appointments */}
                {activeTab === "past" &&
                  (filteredPastAppointments.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                      <Files className="w-12 h-12 mb-3 opacity-20" />
                      <p>No past appointments found.</p>
                    </div>
                  ) : (
                    filteredPastAppointments.map((apt) => (
                      <DoctorAppointmentCard
                        key={apt.id}
                        appointment={apt}
                        doctorId={user.id}
                        onUpdate={() => loadAppointments(user.id)}
                        onStartVideoCall={() => alert("Session completed.")}
                        onPrescribe={() =>
                          setSelectedAppointmentForPrescription(apt)
                        }
                        onCreateMedicalRecord={() =>
                          setSelectedAppointmentForMedicalRecord(apt)
                        }
                      />
                    ))
                  ))}
              </div>
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto anime-in fade-in zoom-in duration-300">
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
          </div>
        </div>
      )}

      {/* Medical Record Modal */}
      {selectedAppointmentForMedicalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto anime-in fade-in zoom-in duration-300">
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
          </div>
        </div>
      )}
    </div>
  );
}
