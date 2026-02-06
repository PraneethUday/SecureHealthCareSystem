"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction, getAllLogs } from "@/lib/logging";
import { getAppointmentLogs } from "@/lib/appointments";
import { AppointmentLog } from "@/lib/database.types";
import {
  Shield,
  Users,
  Activity,
  Settings,
  LogOut,
  Database,
  FileText,
  Calendar,
  Lock,
  Server,
  AlertTriangle
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AdminDashboard() {
  const hasLogged = useRef(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [appointmentLogs, setAppointmentLogs] = useState<AppointmentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAppointmentLogs, setLoadingAppointmentLogs] = useState(true);
  const [activeLogTab, setActiveLogTab] = useState<"system" | "appointments">(
    "system"
  );

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      router.push("/login");
      return;
    }

    setUser(session.user);

    if (!hasLogged.current) {
      logAction({
        userId: session.user.id,
        userRole: "admin",
        action: "dashboard_access",
        resourceType: "auth",
      });
      hasLogged.current = true;
    }

    fetchLogs();
    fetchAppointmentLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async () => {
    try {
      const fetchedLogs = await getAllLogs(50);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAppointmentLogs = async () => {
    try {
      const fetchedLogs = await getAppointmentLogs();
      setAppointmentLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to fetch appointment logs:", error);
    } finally {
      setLoadingAppointmentLogs(false);
    }
  };

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.id,
        userRole: "admin",
        action: "logout",
        resourceType: "auth",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-100 via-slate-100 to-zinc-100 dark:from-gray-950 dark:via-slate-950 dark:to-zinc-950 pb-10 transition-colors duration-500">

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-300 dark:bg-gray-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-slate-300 dark:bg-slate-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-zinc-300 dark:bg-zinc-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl animate-blob animation-delay-4000"></div>
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
              <div className="bg-gradient-to-br from-gray-700 to-black dark:from-gray-800 dark:to-gray-950 rounded-xl p-2.5 shadow-lg shadow-gray-900/20 transform transition-transform hover:scale-105">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  System Administrator • Full Access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* Admin Info & Security Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Info Card */}
          <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 p-6 flex flex-col justify-between group hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-3 rounded-full shadow-inner">
                <Users className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{user.full_name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/50 dark:border-gray-700/50">
                <span className="text-sm text-gray-500 dark:text-gray-400">Admin ID</span>
                <span className="font-mono text-sm font-medium dark:text-gray-200">{user.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2"><Lock className="w-3 h-3" /> Access Level</span>
                <span className="text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg">ROOT / FULL</span>
              </div>
            </div>
          </div>

          {/* Security Status - Spans 2 cols */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group border border-gray-700/50">
            <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/4 group-hover:opacity-30 transition-opacity"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><Shield className="w-6 h-6 text-green-400" /></div>
                  <h2 className="text-2xl font-bold">System Security Status</h2>
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl backdrop-blur-md flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm font-medium">All Systems Operational</span>
                  </div>
                  <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl backdrop-blur-md flex items-center gap-2">
                    <Lock className="w-3 h-3 text-blue-300" />
                    <span className="text-blue-300 text-sm font-medium">AES-256 Enabled</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                  <p className="text-xs text-gray-300 mb-1">Database</p>
                  <div className="flex items-center gap-2 text-green-400 font-bold"><Database className="w-4 h-4" /> Online</div>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                  <p className="text-xs text-gray-300 mb-1">Firewall</p>
                  <div className="flex items-center gap-2 text-green-400 font-bold"><Shield className="w-4 h-4" /> Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Patients", count: "-", color: "bg-blue-500", icon: Users },
            { label: "Total Doctors", count: "-", color: "bg-green-500", icon: Activity },
            { label: "Total Nurses", count: "-", color: "bg-purple-500", icon: Users },
            { label: "Total Staff", count: "-", color: "bg-orange-500", icon: Users }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-lg ${stat.color} text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="group bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/40 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 text-left">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">User Management</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add, remove, or edit system users</p>
          </button>

          <button className="group bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/40 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 text-left">
            <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-xl w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600 dark:text-purple-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Database Manager</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Direct access to system records</p>
          </button>

          <button className="group bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/40 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 text-left">
            <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-xl w-fit mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors text-orange-600 dark:text-orange-400">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">System Config</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Global settings and parameters</p>
          </button>

          <button className="group bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-gray-200/50 dark:shadow-black/40 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 text-left">
            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl w-fit mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Audit Logs</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Security and access trails</p>
          </button>
        </div>

        {/* Access Logs Section - Glass Table */}
        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100/50 dark:border-gray-800/50">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Live System Logs
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Real-time monitoring of all system activities
              </p>
            </div>
            <button
              onClick={() => {
                fetchLogs();
                fetchAppointmentLogs();
              }}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm shadow-sm"
            >
              Scan & Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-4 bg-gray-50/50 dark:bg-gray-800/20">
            <button
              onClick={() => setActiveLogTab("system")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeLogTab === "system" ? "bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
            >
              System Logs
            </button>
            <button
              onClick={() => setActiveLogTab("appointments")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeLogTab === "appointments" ? "bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
            >
              Appointment Logs
            </button>
          </div>

          {/* System Logs Table */}
          {activeLogTab === "system" &&
            (loadingLogs ? (
              <div className="text-center py-20">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-800 dark:border-gray-300 border-r-transparent"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">Decrypting logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No activity logs found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {logs.map((log, index) => (
                      <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span className="font-mono text-xs text-gray-400">ID:</span> {log.user_id.substring(0, 6)}...
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${log.user_role === "admin"
                              ? "bg-gray-800 dark:bg-gray-700 text-white"
                              : log.user_role === "doctor"
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                : log.user_role === "nurse"
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                                  : log.user_role === "staff"
                                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                                    : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                              }`}
                          >
                            {log.user_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 font-medium">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {log.details}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${log.status === "success"
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
                              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30"
                              }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${log.status === "success" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* Appointment Logs Table */}
          {activeLogTab === "appointments" &&
            (loadingAppointmentLogs ? (
              <div className="text-center py-20">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-800 dark:border-gray-300 border-r-transparent"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">Fetching appointment history...</p>
              </div>
            ) : appointmentLogs.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No appointment records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {appointmentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-800 dark:text-gray-200">
                          {log.appointment_id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${log.action_type === "created"
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                              : log.action_type === "updated"
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                : log.action_type === "cancelled"
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                                  : log.action_type === "completed"
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {log.performed_by_user_id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${log.performed_by_role === "patient"
                              ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900/30"
                              : log.performed_by_role === "doctor"
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900/30"
                                : "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                              }`}
                          >
                            {log.performed_by_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 font-mono max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
