"use client";
import { useRef } from "react";
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
  ShieldCheck,
  TrendingUp,
  Clock,
  Bell
} from "lucide-react";
import AppointmentCard from "./components/AppointmentCard";
import NewAppointmentForm from "./components/NewAppointmentForm";
import PrescriptionsList from "./components/PrescriptionsList";
import MedicalRecordsList from "./components/MedicalRecordsList";
import HealthProfileForm from "./components/HealthProfileForm";
import VitalsForm from "./components/VitalsForm";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/lib/supabase";

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
      new Date() && apt.status === "scheduled"
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date + "T" + apt.appointment_time) <
      new Date() ||
      apt.status === "completed" ||
      apt.status === "cancelled" ||
      apt.status === "no_show"
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
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-red-100 via-rose-100 to-pink-100 dark:from-red-950 dark:via-rose-950 dark:to-pink-950 selection:bg-rose-500 selection:text-white pb-10 transition-colors duration-500">

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-300 dark:bg-red-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-300 dark:bg-rose-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-300 dark:bg-pink-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-gray-800/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-900 dark:to-rose-800 rounded-xl p-2.5 shadow-lg shadow-red-500/20 transform transition-transform hover:scale-105">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Patient Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {getDayGreeting()}, {user.first_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-semibold shadow-sm">
                ID: {user.patient_id}
              </div>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 active:scale-95 transition-all shadow-sm hover:shadow-md font-medium text-sm group"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat 1: Next Appointment */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md shadow-blue-500/20 text-white">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-900">
                Next Up
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Next Appointment</h3>
            {upcomingAppointments.length > 0 ? (
              <div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {upcomingAppointments[0].appointment_time} with Dr. {upcomingAppointments[0].doctor_name?.split(' ').pop()}
                </p>
              </div>
            ) : (
              <p className="text-lg font-semibold text-gray-400 dark:text-gray-500">No upcoming visits</p>
            )}
          </div>

          {/* Stat 2: Active Prescriptions */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-xl shadow-md shadow-emerald-500/20 text-white">
                <Pill className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
                Active
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Prescriptions</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {/* This would be active count if available, using placeholder */}
              --
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current active medications
            </p>
          </div>

          {/* Stat 3: Security Status */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer" onClick={() => router.push("/dashboard/patient/access-logs")}>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-md shadow-amber-500/20 text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-900 animate-pulse">
                Secure
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Account Security</h3>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
              Protected & Logged
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircleIcon className="w-3 h-3" /> No suspicious activity
            </p>
          </div>
        </div>

        {/* Main Content Area (Glass Card) */}
        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden">

          {/* Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
              {(["appointments", "prescriptions", "records"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab
                    ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "appointments" && (
              <button
                onClick={() => setShowNewAppointment(true)}
                className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 font-medium text-sm"
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
                    <p className="text-gray-400 font-medium">Fetching your schedule...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appointmentSubTab === "upcoming" ? (
                      filteredUpcomingAppointments.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Calendar className="w-8 h-8 text-gray-300" />
                          </div>
                          <h3 className="text-gray-900 font-medium">No appointments scheduled</h3>
                          <p className="text-gray-500 text-sm mt-1 mb-4">You&apos;re all clear for now!</p>
                          <button onClick={() => setShowNewAppointment(true)} className="text-rose-600 font-semibold text-sm hover:underline">
                            Book a new visit
                          </button>
                        </div>
                      ) : (
                        filteredUpcomingAppointments.map((apt) => (
                          <AppointmentCard key={apt.id} appointment={apt} onUpdate={() => loadAppointments(user.id)} />
                        ))
                      )
                    ) : filteredPastAppointments.length === 0 ? (
                      <div className="col-span-2 text-center py-16 text-gray-400">No past appointments found.</div>
                    ) : (
                      filteredPastAppointments.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} onUpdate={() => loadAppointments(user.id)} />
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

          </div>
        </div>

        {/* Quick Actions Footer - Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            icon={<Calendar className="w-8 h-8 text-white" />}
            title="Book Visit"
            desc="Schedule a new appointment"
            color="from-red-500 to-rose-600"
            onClick={() => setShowNewAppointment(true)}
          />
          <ActionCard
            icon={<Heart className="w-8 h-8 text-white" />}
            title="Vitals"
            desc="Update your health metrics"
            color="from-pink-500 to-purple-600"
            onClick={() => setShowVitalsModal(true)}
          />
          <ActionCard
            icon={<ShieldCheck className="w-8 h-8 text-white" />}
            title="Access Log"
            desc="View security history"
            color="from-emerald-500 to-teal-600"
            onClick={() => router.push("/dashboard/patient/access-logs")}
          />
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
            <VitalsForm
              patientId={user.id}
              onClose={() => setShowVitalsModal(false)}
              onSuccess={() => {
                setShowVitalsModal(false);
                // Optionally refresh data here
              }}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ActionCard({ icon, title, desc, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-xl hover:bg-white/80 dark:hover:bg-gray-700/80 hover:-translate-y-1"
    >
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${color} rounded-bl-3xl`}>
        {/* Decorative corner */}
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-200">
          <span className="text-lg">→</span>
        </div>
      </div>
    </button>
  )
}
