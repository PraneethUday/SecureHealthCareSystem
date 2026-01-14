"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function AdminDashboard() {
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
    } else {
      setUser(session.user);
      // Log dashboard access
      logAction({
        userId: session.user.id,
        userRole: "admin",
        action: "dashboard_access",
        details: "Admin accessed dashboard",
      });
      // Fetch logs
      fetchLogs();
      fetchAppointmentLogs();
    }
  }, [router]);

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
        details: "Admin logged out",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-full p-2">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  System Administrator - Full Access
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Administrator Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Admin ID</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Access Level</p>
              <p className="font-medium text-red-600">Full System Access</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Patients</p>
            <p className="text-2xl font-bold text-gray-800">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
            <p className="text-sm text-gray-500">Total Doctors</p>
            <p className="text-2xl font-bold text-gray-800">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-500">
            <p className="text-sm text-gray-500">Total Nurses</p>
            <p className="text-2xl font-bold text-gray-800">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-800">-</p>
          </div>
        </div>
        
{/* Data Security Status – Full Width */}
<div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

    {/* Left Section */}
    <div className="flex items-center gap-4">
      <div className="bg-green-100 p-3 rounded-full">
        <Lock className="w-7 h-7 text-green-700" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Data Security Status
        </h2>
        <p className="text-sm text-gray-500">
          Medical data protection overview
        </p>
      </div>
    </div>

    {/* Right Section */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">

      {/* Encryption at Rest */}
      <div className="bg-gray-50 rounded-lg p-4 min-w-[240px]">
        <p className="text-sm text-gray-500 mb-1">Encryption at Rest</p>
        <p className="font-semibold text-green-700 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Enabled
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Stored medical data is encrypted and unreadable without keys
        </p>
      </div>

      {/* Algorithm */}
      <div className="bg-gray-50 rounded-lg p-4 min-w-[240px]">
        <p className="text-sm text-gray-500 mb-1">Encryption Algorithm</p>
        <p className="font-semibold text-gray-800">
          AES-256
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Industry-standard strong encryption (read-only)
        </p>
      </div>

    </div>
  </div>
</div>
        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              User Management
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage all users in the system
            </p>
            <button className="text-gray-700 font-medium text-sm hover:underline">
              Manage Users →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Database className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Database Management
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View and manage database records
            </p>
            <button className="text-gray-700 font-medium text-sm hover:underline">
              View Database →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Activity className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Access Logs
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Monitor system access and activities
            </p>
            <button className="text-gray-700 font-medium text-sm hover:underline">
              View Below ↓
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Settings className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              System Settings
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Configure system settings and preferences
            </p>
            <button className="text-gray-700 font-medium text-sm hover:underline">
              Manage Settings →
            </button>
          </div>
        </div>

        {/* Access Logs Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                System Logs
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Real-time monitoring of all system activities
              </p>
            </div>
            <button
              onClick={() => {
                fetchLogs();
                fetchAppointmentLogs();
              }}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
            >
              Refresh Logs
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveLogTab("system")}
              className={`pb-2 px-1 font-medium transition-colors flex items-center gap-2 ${
                activeLogTab === "system"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Activity className="w-4 h-4" />
              System Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveLogTab("appointments")}
              className={`pb-2 px-1 font-medium transition-colors flex items-center gap-2 ${
                activeLogTab === "appointments"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Appointment Logs ({appointmentLogs.length})
            </button>
          </div>

          {/* System Logs Table */}
          {activeLogTab === "system" &&
            (loadingLogs ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-800 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No logs available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {log.user_id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              log.user_role === "admin"
                                ? "bg-gray-100 text-gray-800"
                                : log.user_role === "doctor"
                                ? "bg-blue-100 text-blue-800"
                                : log.user_role === "nurse"
                                ? "bg-purple-100 text-purple-800"
                                : log.user_role === "staff"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.user_role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
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
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-800 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">
                  Loading appointment logs...
                </p>
              </div>
            ) : appointmentLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No appointment logs available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Appointment ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Performed By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointmentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-800">
                          {log.appointment_id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              log.action_type === "created"
                                ? "bg-blue-100 text-blue-800"
                                : log.action_type === "updated"
                                ? "bg-yellow-100 text-yellow-800"
                                : log.action_type === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : log.action_type === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {log.performed_by_user_id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              log.performed_by_role === "patient"
                                ? "bg-red-100 text-red-800"
                                : log.performed_by_role === "doctor"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {log.performed_by_role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
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
