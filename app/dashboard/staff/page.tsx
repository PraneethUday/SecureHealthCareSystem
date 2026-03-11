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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-violet-600 dark:bg-violet-500 rounded-lg p-2">
                <UserCog className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Staff Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.first_name} {user.last_name} • {user.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-medium rounded-lg">
                {user.staff_id}
              </div>
              <NotificationBell userId={user.id} userRole="staff" />
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
        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("pharmacy")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "pharmacy"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Pill className="w-4 h-4" />
              Pharmacy
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "appointments"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${activeTab === "appointments" ? "text-purple-500 dark:text-purple-400" : ""}`}
              />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "patients"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users
                className={`w-4 h-4 ${activeTab === "patients" ? "text-purple-500 dark:text-purple-400" : ""}`}
              />
              Patients
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 md:p-8">
              <PharmacyManager staffId={user.staff_id} />
            </div>
          ) : activeTab === "appointments" ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 md:p-8">
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
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Hospital className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Hospital
                      </p>
                      <p
                        className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate"
                        title={hospitalName}
                      >
                        {hospitalName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stat: Role */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl text-purple-600 dark:text-purple-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Role
                    </p>
                    <p
                      className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate"
                      title={user.role}
                    >
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Stat: Department */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="bg-violet-100 dark:bg-violet-900/50 p-3 rounded-xl text-violet-600 dark:text-violet-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Department
                    </p>
                    <p
                      className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate"
                      title={user.department}
                    >
                      {user.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 pl-2 border-l-4 border-purple-500">
                Staff Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab("pharmacy")}
                  className="group bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl text-purple-600 dark:text-purple-400">
                      <FileText className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Records Management
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Manage medical records and documentation efficiently.
                  </p>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm flex items-center gap-1">
                    View Records →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("appointments")}
                  className="group bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-violet-100 dark:bg-violet-900/50 p-3 rounded-xl text-violet-600 dark:text-violet-400">
                      <Calendar className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Appointments
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Schedule and manage clinic appointments.
                  </p>
                  <span className="text-violet-600 dark:text-violet-400 font-semibold text-sm flex items-center gap-1">
                    Open Calendar →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("patients")}
                  className="group bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Patient Directory
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Access detailed patient information and contacts.
                  </p>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center gap-1">
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
