"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";
import { Heart, Calendar, FileText, LogOut, User } from "lucide-react";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "patient") {
      router.push("/login");
    } else {
      setUser(session.user);
      // Log dashboard access
      logAction({
        userId: session.user.patient_id || session.user.email,
        userRole: "patient",
        action: "dashboard_access",
        details: "Patient accessed dashboard",
      });
    }
  }, [router]);

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.patient_id || user.email,
        userRole: "patient",
        action: "logout",
        details: "Patient logged out",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-full p-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Patient Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.first_name} {user.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Health Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">
                {user.date_of_birth || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="font-medium">{user.patient_id}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100">
            <Calendar className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Appointments
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View and schedule your medical appointments
            </p>
            <button className="text-red-600 font-medium text-sm hover:underline">
              View Appointments →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100">
            <FileText className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Medical Records
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Access your medical history and records
            </p>
            <button className="text-red-600 font-medium text-sm hover:underline">
              View Records →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100">
            <User className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Profile Settings
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Update your personal information
            </p>
            <button className="text-red-600 font-medium text-sm hover:underline">
              Edit Profile →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
