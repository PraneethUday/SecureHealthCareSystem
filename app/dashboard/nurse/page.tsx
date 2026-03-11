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
  FileHeart,
  Upload,
  Stethoscope,
  ClipboardList,
  Hospital,
} from "lucide-react";
import { MedicalReportUpload } from "./components/MedicalReportUpload";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/app/dashboard/components/NotificationBell";
import { PatientCare } from "./components/PatientCare";

export default function NurseDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "upload" | "patientCare"
  >("overview");

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
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 dark:bg-emerald-500 rounded-lg p-2">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Nurse Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.first_name} {user.last_name} • {user.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg">
                {user.shift} Shift
              </div>
              <NotificationBell userId={user.id} userRole="nurse" />
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
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "upload" ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <MedicalReportUpload nurseId={user.nurse_id} />
            </div>
          ) : activeTab === "patientCare" ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <PatientCare nurseId={user.nurse_id} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat: Hospital */}
                {hospitalName && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg">
                        <Hospital className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Hospital
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {hospitalName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stat: Department */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                      <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Department
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.department}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stat: Shift */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                      <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Current Shift
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.shift}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stat: ID */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Nurse ID
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.nurse_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab("patientCare")}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Patient Care
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    View assigned patients and update care plans
                  </p>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    Open Dashboard →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("upload")}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Upload Reports
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    Upload patient lab results and documents
                  </p>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
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
