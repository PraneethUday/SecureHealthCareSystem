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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-blue-500 rounded-lg p-2">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Doctor Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dr. {user.first_name} {user.last_name} • {user.specialization}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-lg">
                {user.doctor_id}
              </div>
              <NotificationBell userId={user.id} userRole="doctor" />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat: Today's Appointments */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {todayAppointments.length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Today&apos;s Appointments
                </p>
              </div>
            </div>
          </div>

          {/* Stat: Total Patients */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {uniquePatients}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Patients
                </p>
              </div>
            </div>
          </div>

          {/* Stat: Pending Reports */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <Files className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {pendingReportsCount}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Reports to Review
                </p>
              </div>
            </div>
          </div>

          {/* Appointments Calendar Widget */}
          <AppointmentsCalendar appointments={appointments} />
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-full">
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
              <div className="mt-4 md:mt-0 relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            )}
          </div>

          {/* Tab Content Staging Area */}
          <div className="p-6">
            {activeTab === "reports" ? (
              <div>
                <MedicalReportsViewer doctorId={user.doctor_id} />
              </div>
            ) : loadingAppointments ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Loading appointments...
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
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
