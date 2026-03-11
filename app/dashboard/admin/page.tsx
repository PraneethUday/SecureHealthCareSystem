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
  Calendar,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  ChevronRight,
  Stethoscope,
  Heart,
  Briefcase,
  Search,
  Filter,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/app/dashboard/components/NotificationBell";
import CreateUserModal from "@/components/CreateUserModal";
import ViewUsersModal from "@/components/ViewUsersModal";
import SecurityMonitoringPanel from "./components/SecurityMonitoringPanel";

export default function AdminDashboard() {
  const hasLogged = useRef(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [appointmentLogs, setAppointmentLogs] = useState<AppointmentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAppointmentLogs, setLoadingAppointmentLogs] = useState(true);
  const [activeLogTab, setActiveLogTab] = useState<"system" | "appointments" | "security">(
    "system",
  );
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showViewUsersModal, setShowViewUsersModal] = useState(false);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalNurses: 0,
    totalStaff: 0,
  });

  // Log filters
  const [logRoleFilter, setLogRoleFilter] = useState<string>("all");
  const [logDateFilter, setLogDateFilter] = useState<string>("");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");

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
    fetchStatistics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async () => {
    try {
      const fetchedLogs = await getAllLogs(500);
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

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `/api/admin/statistics?adminId=${user?.id || "admin"}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStatistics({
          totalPatients: data.totalPatients,
          totalDoctors: data.totalDoctors,
          totalNurses: data.totalNurses,
          totalStaff: data.totalStaff,
        });
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 dark:bg-slate-100 rounded-lg p-2">
                <Shield className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  System Administrator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell userId="admin" userRole="admin" />
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user.full_name?.split(" ")[0] || "Admin"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here&apos;s an overview of your healthcare system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalPatients}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Patients
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalDoctors}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Doctors
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalNurses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nurses
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalStaff}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Staff
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Add User
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create new account
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button
              onClick={() => setShowViewUsersModal(true)}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    View Users
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage accounts
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </button>

            <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                  <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Settings
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    System config
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </button>

            <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Database
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage records
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Activity Logs
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {activeLogTab === "system"
                  ? logs.length
                  : appointmentLogs.length}{" "}
                entries
              </span>
            </div>
            <button
              onClick={() => {
                fetchLogs();
                fetchAppointmentLogs();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveLogTab("system")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeLogTab === "system"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              System Logs
            </button>
            <button
              onClick={() => setActiveLogTab("appointments")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeLogTab === "appointments"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveLogTab("security")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeLogTab === "security"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Security
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by user, action..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={logRoleFilter}
                  onChange={(e) => setLogRoleFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="staff">Staff</option>
                  <option value="patient">Patient</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <input
                  type="date"
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Clear Filters */}
              {(logRoleFilter !== "all" || logDateFilter || logSearchQuery) && (
                <button
                  onClick={() => {
                    setLogRoleFilter("all");
                    setLogDateFilter("");
                    setLogSearchQuery("");
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* System Logs */}
          {activeLogTab === "system" &&
            (loadingLogs ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading logs...</span>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Database className="w-12 h-12 mb-3 opacity-40" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs
                      .filter((log) => {
                        // Role filter
                        if (
                          logRoleFilter !== "all" &&
                          log.user_role !== logRoleFilter
                        )
                          return false;
                        // Date filter
                        if (logDateFilter) {
                          const logDate = new Date(log.timestamp)
                            .toISOString()
                            .split("T")[0];
                          if (logDate !== logDateFilter) return false;
                        }
                        // Search filter
                        if (logSearchQuery) {
                          const query = logSearchQuery.toLowerCase();
                          return (
                            log.user_id?.toLowerCase().includes(query) ||
                            log.action?.toLowerCase().includes(query) ||
                            log.user_role?.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      .map((log, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {log.user_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                log.user_role === "admin"
                                  ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  : log.user_role === "doctor"
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : log.user_role === "nurse"
                                      ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                                      : log.user_role === "staff"
                                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                        : "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                              }`}
                            >
                              {log.user_role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {log.action}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                log.status === "success"
                                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${log.status === "success" ? "bg-emerald-500" : "bg-red-500"}`}
                              ></span>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* Appointment Logs */}
          {activeLogTab === "appointments" &&
            (loadingAppointmentLogs ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading appointments...</span>
                </div>
              </div>
            ) : appointmentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Calendar className="w-12 h-12 mb-3 opacity-40" />
                <p>No appointment logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Appointment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {appointmentLogs
                      .filter((log) => {
                        // Role filter
                        if (
                          logRoleFilter !== "all" &&
                          log.performed_by_role !== logRoleFilter
                        )
                          return false;
                        // Date filter
                        if (logDateFilter) {
                          const logDate = new Date(log.timestamp)
                            .toISOString()
                            .split("T")[0];
                          if (logDate !== logDateFilter) return false;
                        }
                        // Search filter
                        if (logSearchQuery) {
                          const query = logSearchQuery.toLowerCase();
                          return (
                            log.appointment_id?.toLowerCase().includes(query) ||
                            log.action_type?.toLowerCase().includes(query) ||
                            log.performed_by_role?.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      .map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                            {log.appointment_id.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                log.action_type === "created"
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                  : log.action_type === "updated"
                                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                    : log.action_type === "cancelled"
                                      ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                      : log.action_type === "completed"
                                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                        : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {log.action_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {log.performed_by_user_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                log.performed_by_role === "patient"
                                  ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                  : log.performed_by_role === "doctor"
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {log.performed_by_role}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* Security Monitoring */}
          {activeLogTab === "security" && (
            <div className="p-4">
              <SecurityMonitoringPanel adminId={user?.id || "admin"} />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={() => {
          setShowCreateUserModal(false);
          fetchStatistics();
        }}
        adminId={user?.id || "admin"}
      />

      <ViewUsersModal
        isOpen={showViewUsersModal}
        onClose={() => setShowViewUsersModal(false)}
        adminId={user?.id || "admin"}
      />
    </div>
  );
}
