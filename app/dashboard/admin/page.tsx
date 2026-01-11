"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction, getAllLogs } from "@/lib/logging";
import {
  Shield,
  Users,
  Activity,
  Settings,
  LogOut,
  Database,
  FileText,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

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
                System Access Logs
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Real-time monitoring of all system activities
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
            >
              Refresh Logs
            </button>
          </div>

          {loadingLogs ? (
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
                        {log.details || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.status || "success"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
