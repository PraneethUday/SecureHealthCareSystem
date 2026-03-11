"use client";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import { getPatientAppointments } from "@/lib/appointments";
import { getPatientPrescriptions } from "@/lib/prescriptions";
import {
  AppointmentWithDetails,
  PrescriptionWithDetails,
} from "@/lib/database.types";
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
  ShieldCheck,
  TrendingUp,
  Clock,
  Bell,
} from "lucide-react";
import AppointmentCard from "./components/AppointmentCard";
import NewAppointmentForm from "./components/NewAppointmentForm";
import PrescriptionsList from "./components/PrescriptionsList";
import MedicalRecordsList from "./components/MedicalRecordsList";
import HealthProfileForm from "./components/HealthProfileForm";
import PatientVitalsViewer from "./components/PatientVitalsViewer";
import AccessManagement from "./components/AccessManagement";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/app/dashboard/components/NotificationBell";
import { supabase } from "@/lib/supabase";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    [],
  );
  const [activePrescriptionsCount, setActivePrescriptionsCount] = useState<
    number | null
  >(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "appointments" | "prescriptions" | "records" | "access"
  >("appointments");
  const [showHealthProfileModal, setShowHealthProfileModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
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
  const hasLogged = useRef(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "patient") {
      router.push("/login");
      return;
    }

    setUser(session.user);
    loadAppointments(session.user.id);
    loadPrescriptionCount(session.user.id);
    checkProfileStatus(session.user.id);

    if (!hasLogged.current) {
      logAction({
        userId: session.user.patient_id || session.user.email,
        userRole: "patient",
        action: "dashboard_access",
        resourceType: "auth",
      });
      hasLogged.current = true;
    }
  }, [router]);

  const checkProfileStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("is_profile_completed")
        .eq("id", userId)
        .single();

      if (!error && data && !data.is_profile_completed) {
        setShowHealthProfileModal(true);
      }
    } catch (err) {
      console.error("Error checking profile status:", err);
    }
  };

  const loadAppointments = async (patientId: string) => {
    console.log("📞 Calling getPatientAppointments with UUID:", patientId);
    setLoadingAppointments(true);
    const data = await getPatientAppointments(patientId);
    setAppointments(data);
    setLoadingAppointments(false);
  };

  const loadPrescriptionCount = async (patientId: string) => {
    try {
      const prescriptions = await getPatientPrescriptions(patientId);
      const activeCount = prescriptions.filter(
        (p) => p.status === "active",
      ).length;
      setActivePrescriptionsCount(activeCount);
    } catch (error) {
      console.error("Error loading prescription count:", error);
      setActivePrescriptionsCount(0);
    }
  };

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.patient_id || user.email,
        userRole: "patient",
        action: "logout",
        resourceType: "auth",
      });
    }
    clearSession();
    router.push("/login");
  };

  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) >=
        new Date() && apt.status === "scheduled",
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) <
        new Date() ||
      apt.status === "completed" ||
      apt.status === "cancelled" ||
      apt.status === "no_show",
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

  const getDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-rose-600 dark:bg-rose-500 rounded-lg p-2">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Patient Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getDayGreeting()}, {user.first_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-medium rounded-lg">
                {user.patient_id}
              </div>
              <NotificationBell userId={user.id} userRole="patient" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stat 1: Next Appointment */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Next Appointment
              </p>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {new Date(
                    upcomingAppointments[0].appointment_date,
                  ).toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {upcomingAppointments[0].appointment_time} with Dr.{" "}
                  {upcomingAppointments[0].doctor_name?.split(" ").pop()}
                </p>
              </div>
            ) : (
              <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">
                No upcoming visits
              </p>
            )}
          </div>

          {/* Stat 2: Active Prescriptions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Active Prescriptions
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activePrescriptionsCount !== null ? (
                activePrescriptionsCount
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              )}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Current medications
            </p>
          </div>

          {/* Stat 3: Security Status */}
          <div
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-colors cursor-pointer"
            onClick={() => router.push("/dashboard/patient/access-logs")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Account Security
              </p>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              Protected
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircleIcon className="w-3 h-3" /> No suspicious activity
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                ["appointments", "prescriptions", "records", "access"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "appointments" && (
              <button
                onClick={() => setShowNewAppointment(true)}
                className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Book Appointment
              </button>
            )}
          </div>

          {/* Tab Content Staging Area */}
          <div className="p-6 md:p-8 min-h-[500px]">
            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
                  <div className="relative w-full sm:w-72 group">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      value={appointmentSearchTerm}
                      onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                      placeholder="Search appointments..."
                      className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-gray-100 transition-all shadow-sm"
                    />
                  </div>
                  {/* Filters omitted for brevity, keeping layout clean */}
                  <div className="flex gap-2">
                    {/* Simplified Filter Toggle */}
                    <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-lg">
                      <button
                        onClick={() => setAppointmentSubTab("upcoming")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${appointmentSubTab === "upcoming" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setAppointmentSubTab("past")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${appointmentSubTab === "past" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        Past
                      </button>
                    </div>
                  </div>
                </div>

                {loadingAppointments ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
                    <p className="text-gray-400 font-medium">
                      Fetching your schedule...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appointmentSubTab === "upcoming" ? (
                      filteredUpcomingAppointments.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Calendar className="w-8 h-8 text-gray-300" />
                          </div>
                          <h3 className="text-gray-900 font-medium">
                            No appointments scheduled
                          </h3>
                          <p className="text-gray-500 text-sm mt-1 mb-4">
                            You&apos;re all clear for now!
                          </p>
                          <button
                            onClick={() => setShowNewAppointment(true)}
                            className="text-rose-600 font-semibold text-sm hover:underline"
                          >
                            Book a new visit
                          </button>
                        </div>
                      ) : (
                        filteredUpcomingAppointments.map((apt) => (
                          <AppointmentCard
                            key={apt.id}
                            appointment={apt}
                            onUpdate={() => loadAppointments(user.id)}
                          />
                        ))
                      )
                    ) : filteredPastAppointments.length === 0 ? (
                      <div className="col-span-2 text-center py-16 text-gray-400">
                        No past appointments found.
                      </div>
                    ) : (
                      filteredPastAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          onUpdate={() => loadAppointments(user.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === "prescriptions" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PrescriptionsList patientId={user.id} />
              </div>
            )}

            {/* Records Tab */}
            {activeTab === "records" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MedicalRecordsList patientId={user.id} />
              </div>
            )}

            {/* Access Management Tab */}
            {activeTab === "access" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AccessManagement patientId={user.id} />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowNewAppointment(true)}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Book Visit
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Schedule a new appointment</p>
          </button>

          <button
            onClick={() => setShowVitalsModal(true)}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Vitals
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">View your health metrics</p>
          </button>

          <button
            onClick={() => router.push("/dashboard/patient/access-logs")}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Access Log
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">View security history</p>
          </button>
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

      {/* Health Profile Modal */}
      {showHealthProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <HealthProfileForm
              patientId={user.id}
              isInitial={true}
              onSuccess={() => setShowHealthProfileModal(false)}
              onClose={() => setShowHealthProfileModal(false)}
            />
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl shadow-2xl p-6 md:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <PatientVitalsViewer
              patientId={user.id}
              onClose={() => setShowVitalsModal(false)}
            />
          </div>
        </div>
      )}

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
    </div>
  );
}

// Helper Components
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}


