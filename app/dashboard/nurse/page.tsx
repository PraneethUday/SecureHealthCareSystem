"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import {
  Heart,
  Users,
  Clock,
  FileText,
  LogOut,
  Activity,
  Calendar,
  FileHeart,
  Upload,
  Stethoscope,
  ClipboardList,
  Hospital,
} from "lucide-react";
import { MedicalReportUpload } from "./components/MedicalReportUpload";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PatientCare } from "./components/PatientCare";

export default function NurseDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "patientCare">("overview");

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "nurse") {
      router.push("/login");
    } else {
      setUser(session.user);
      // Fetch assigned hospital name
      fetchHospitalName(session.user.nurse_id);
      // Log dashboard access
      logAction({
        userId: session.user.nurse_id,
        userRole: "nurse",
        action: "dashboard_access",
      });
    }
  }, [router]);

  const fetchHospitalName = async (nurseId: string) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("nurse_hospitals")
        .select("hospitals(name)")
        .eq("nurse_id", nurseId)
        .limit(1)
        .single();
      if (data && (data as any).hospitals?.name) {
        setHospitalName((data as any).hospitals.name);
      }
    } catch {
      // Hospital info not available yet (table may not exist)
    }
  };

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.nurse_id,
        userRole: "nurse",
        action: "logout",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 pb-10 transition-colors duration-500">

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200 dark:bg-green-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-200 dark:bg-emerald-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-teal-200 dark:bg-teal-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

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

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-gray-800/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-900 dark:to-emerald-800 rounded-xl p-2.5 shadow-lg shadow-green-500/20 transform transition-transform hover:scale-105">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Nurse Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {user.first_name} {user.last_name} • {user.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900 text-xs text-green-700 dark:text-green-400 font-semibold shadow-sm">
                Shift: {user.shift}
              </div>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-gray-700 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-300 active:scale-95 transition-all shadow-sm hover:shadow-md font-medium text-sm group"
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
          <div className="inline-flex bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
            {[
              { id: "overview", label: "Overview", icon: ClipboardList },
              { id: "patientCare", label: "Patient Care", icon: Heart },
              { id: "upload", label: "Upload Reports", icon: Upload },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-md shadow-green-900/5 transform scale-105"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${activeTab === tab.id ? "text-green-500 dark:text-green-400" : ""}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="anime-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "upload" ? (
            <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden p-6 md:p-8">
              <MedicalReportUpload nurseId={user.nurse_id} />
            </div>
          ) : activeTab === "patientCare" ? (
            <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden p-6 md:p-8">
              <PatientCare nurseId={user.nurse_id} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat: Hospital */}
                {hospitalName && (
                  <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                    <div className="bg-gradient-to-br from-cyan-400 to-teal-500 p-4 rounded-2xl shadow-lg shadow-cyan-500/20 text-white">
                      <Hospital className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hospital</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{hospitalName}</p>
                    </div>
                  </div>
                )}

                {/* Stat: Department */}
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-2xl shadow-lg shadow-green-500/20 text-white">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{user.department}</p>
                  </div>
                </div>

                {/* Stat: Shift */}
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                  <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-4 rounded-2xl shadow-lg shadow-teal-500/20 text-white">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Shift</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{user.shift}</p>
                  </div>
                </div>

                {/* Stat: ID */}
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
                  <div className="bg-gradient-to-br from-emerald-400 to-green-500 p-4 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nurse ID</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{user.nurse_id}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 pl-2 border-l-4 border-green-500">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div
                  onClick={() => setActiveTab("patientCare")}
                  className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors text-green-600 dark:text-green-400">
                      <Users className="w-8 h-8" />
                    </div>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">Manage</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Patient Care</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">View assigned patients, check vitals, and update care plans efficiently.</p>
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open Dashboard →
                  </span>
                </div>

                <div
                  className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-colors text-teal-600 dark:text-teal-400">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded-full group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Schedule</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Shift Schedule</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">Check your upcoming shifts, roster changes, and break timings.</p>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Schedule →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("upload")}
                  className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-md border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-20 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="bg-white p-3 rounded-xl shadow-sm text-green-600 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">New</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 relative z-10">Upload Medical Reports</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 relative z-10">Securely upload patient lab results, imaging, and other documents.</p>
                  <span className="text-green-700 dark:text-green-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10">
                    Start Upload →
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
