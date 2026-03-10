"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import {
  Users,
  FileText,
  Calendar,
  Settings,
  LogOut,
  UserCog,
  Pill,
  Briefcase,
  Hospital,
  Plus,
} from "lucide-react";
import { PharmacyManager } from "./components/PharmacyManager";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/app/dashboard/components/NotificationBell";
import StaffAppointmentForm from "./components/StaffAppointmentForm";
import PatientDirectory from "./components/PatientDirectory";

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "pharmacy" | "appointments" | "patients" | "overview"
  >("pharmacy");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "staff") {
      router.push("/login");
    } else {
      setUser(session.user);
      // Fetch assigned hospital name
      fetchHospitalName(session.user.staff_id);
      // Log dashboard access
      logAction({
        userId: session.user.staff_id,
        userRole: "staff",
        action: "dashboard_access",
      });
    }
  }, [router]);

  const fetchHospitalName = async (staffId: string) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      // First get the UUID from staff table using staff_id
      const { data: staffData } = await supabase
        .from("staff")
        .select("id")
        .eq("staff_id", staffId)
        .single();

      if (!staffData?.id) return;

      // Then query the junction table with the UUID
      const { data } = await supabase
        .from("staff_hospitals")
        .select("hospital_id, hospitals(name)")
        .eq("staff_id", staffData.id)
        .limit(1)
        .single();
      if (data) {
        if ((data as any).hospitals?.name) {
          setHospitalName((data as any).hospitals.name);
        }
        if ((data as any).hospital_id) {
          setHospitalId((data as any).hospital_id);
        }
      }
    } catch {
      // Hospital info not available yet (table may not exist)
    }
  };

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.staff_id,
        userRole: "staff",
        action: "logout",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-950 dark:via-violet-950 dark:to-indigo-950 pb-10 transition-colors duration-500">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-200 dark:bg-violet-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-fuchsia-200 dark:bg-fuchsia-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
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
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 dark:from-purple-900 dark:to-violet-800 rounded-xl p-2.5 shadow-lg shadow-purple-500/20 transform transition-transform hover:scale-105">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Staff Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {user.first_name} {user.last_name} • {user.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900 text-xs text-purple-700 dark:text-purple-400 font-semibold shadow-sm">
                ID: {user.staff_id}
              </div>
              <NotificationBell userId={user.id} userRole="staff" />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 text-purple-700 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-300 active:scale-95 transition-all shadow-sm hover:shadow-md font-medium text-sm group"
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
        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("pharmacy")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "pharmacy"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md shadow-purple-900/5 transform scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Pill
                className={`w-4 h-4 ${activeTab === "pharmacy" ? "text-purple-500 dark:text-purple-400" : ""}`}
              />
              Pharmacy
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "appointments"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md shadow-purple-900/5 transform scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${activeTab === "appointments" ? "text-purple-500 dark:text-purple-400" : ""}`}
              />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "patients"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md shadow-purple-900/5 transform scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Users
                className={`w-4 h-4 ${activeTab === "patients" ? "text-purple-500 dark:text-purple-400" : ""}`}
              />
              Patients
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "overview"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md shadow-purple-900/5 transform scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <UserCog
                className={`w-4 h-4 ${activeTab === "overview" ? "text-purple-500 dark:text-purple-400" : ""}`}
              />
              Overview
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="anime-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "pharmacy" ? (
            <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden p-6 md:p-8">
              <PharmacyManager staffId={user.staff_id} />
            </div>
          ) : activeTab === "appointments" ? (
            <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-500" />
                    Book Appointment
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Book appointments for patients visiting{" "}
                    {hospitalName || "the hospital"}
                  </p>
                </div>
                {hospitalId && (
                  <button
                    onClick={() => setShowAppointmentForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Plus className="w-5 h-5" />
                    New Appointment
                  </button>
                )}
              </div>

              {!hospitalId ? (
                <div className="text-center py-12">
                  <Hospital className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    No hospital assigned
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Contact admin to assign you to a hospital
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Calendar className="w-16 h-16 mx-auto text-purple-300 dark:text-purple-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    Ready to book appointments
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 max-w-md mx-auto">
                    Click &quot;New Appointment&quot; to book an appointment for
                    a patient visiting {hospitalName}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === "patients" ? (
            <PatientDirectory />
          ) : (
            <div className="space-y-8">
              {/* Profile Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat: Hospital */}
                {hospitalName && (
                  <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                    <div className="bg-gradient-to-br from-indigo-400 to-blue-500 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                      <Hospital className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Hospital
                      </p>
                      <p
                        className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate"
                        title={hospitalName}
                      >
                        {hospitalName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stat: Role */}
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-400 to-violet-500 p-3 rounded-2xl shadow-lg shadow-purple-500/20 text-white">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Role
                    </p>
                    <p
                      className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate"
                      title={user.role}
                    >
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Stat: Department */}
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                  <div className="bg-gradient-to-br from-violet-400 to-indigo-500 p-3 rounded-2xl shadow-lg shadow-violet-500/20 text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Department
                    </p>
                    <p
                      className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate"
                      title={user.department}
                    >
                      {user.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 pl-2 border-l-4 border-purple-500">
                Staff Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab("pharmacy")}
                  className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-600 dark:text-purple-400">
                      <FileText className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Records Management
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    Manage medical records and documentation efficiently.
                  </p>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Records →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("appointments")}
                  className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-violet-100 dark:bg-violet-900/30 p-3 rounded-xl group-hover:bg-violet-500 group-hover:text-white transition-colors text-violet-600 dark:text-violet-400">
                      <Calendar className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Appointments
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    Schedule and manage clinic appointments.
                  </p>
                  <span className="text-violet-600 dark:text-violet-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open Calendar →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("patients")}
                  className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Patient Directory
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    Access detailed patient information and contacts.
                  </p>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Search Patients →
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointment Form Modal */}
        {showAppointmentForm && hospitalId && hospitalName && (
          <StaffAppointmentForm
            staffId={user.staff_id}
            hospitalId={hospitalId}
            hospitalName={hospitalName}
            onClose={() => setShowAppointmentForm(false)}
            onSuccess={() => {
              setShowAppointmentForm(false);
              // Could show a success toast here
            }}
          />
        )}
      </main>
    </div>
  );
}
