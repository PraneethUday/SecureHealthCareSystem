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
} from "lucide-react";
import { MedicalReportUpload } from "./components/MedicalReportUpload";

export default function NurseDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "upload">("upload");

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "nurse") {
      router.push("/login");
    } else {
      setUser(session.user);
      // Log dashboard access
      logAction({
        userId: session.user.nurse_id,
        userRole: "nurse",
        action: "dashboard_access",
        details: "Nurse accessed dashboard",
      });
    }
  }, [router]);

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.nurse_id,
        userRole: "nurse",
        action: "logout",
        details: "Nurse logged out",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Nurse Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  {user.first_name} {user.last_name} - {user.department} (
                  {user.shift} Shift)
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === "upload"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Medical Reports
              </div>
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === "overview"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Overview
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "upload" ? (
          <MedicalReportUpload nurseId={user.nurse_id} />
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Professional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nurse ID</p>
                  <p className="font-medium">{user.nurse_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{user.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium">{user.license_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shift</p>
                  <p className="font-medium">{user.shift}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Patient Care
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  View assigned patients and care plans
                </p>
                <button className="text-green-600 font-medium text-sm hover:underline">
                  View Patients →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <Calendar className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Shift Schedule
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  View your work schedule and tasks
                </p>
                <button className="text-green-600 font-medium text-sm hover:underline">
                  View Schedule →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <FileHeart className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Patient Records
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Access and update patient records
                </p>
                <button className="text-green-600 font-medium text-sm hover:underline">
                  View Records →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
