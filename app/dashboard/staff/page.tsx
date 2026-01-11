import { supabaseServer } from '@/lib/supabase';

export default async function StaffPrescriptionsPage() {
  // Fetch all prescriptions with patient, doctor, appointment info
  const { data: prescriptions, error } = await supabaseServer
    .from('prescriptions')
    .select(`
      id, notes, created_at,
      patient:patient_id ( full_name ),
      doctor:doctor_id ( full_name ),
      appointment:appointment_id ( date ),
      prescription_items (
        medicine_name, dosage, frequency, duration, instructions
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return <div className="text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Active Prescriptions</h1>
      <div className="space-y-6">
        {prescriptions?.map((rx: any) => (
          <div key={rx.id} className="bg-white rounded shadow p-4">
            <div className="mb-2">
              <span className="font-semibold">Patient:</span> {rx.patient?.full_name}
              <span className="ml-4 font-semibold">Doctor:</span> {rx.doctor?.full_name}
              <span className="ml-4 font-semibold">Date:</span> {rx.appointment?.date?.slice(0,10)}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Notes:</span> {rx.notes}
            </div>
            <div>
              <span className="font-semibold">Medicines:</span>
              <ul className="list-disc ml-6">
                {rx.prescription_items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    <span className="font-semibold">{item.medicine_name}</span> — {item.dosage}, {item.frequency}, {item.duration}
                    {item.instructions && <span> ({item.instructions})</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {(!prescriptions || prescriptions.length === 0) && (
          <div className="text-gray-500">No prescriptions found.</div>
        )}
      </div>
    </div>
  );
}
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
} from "lucide-react";

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "staff") {
      router.push("/login");
    } else {
      setUser(session.user);
      // Log dashboard access
      logAction({
        userId: session.user.staff_id,
        userRole: "staff",
        action: "dashboard_access",
        details: "Staff accessed dashboard",
      });
    }
  }, [router]);

  const handleLogout = () => {
    if (user) {
      logAction({
        userId: user.staff_id,
        userRole: "staff",
        action: "logout",
        details: "Staff logged out",
      });
    }
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-full p-2">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Staff Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  {user.first_name} {user.last_name} - {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Staff Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Staff ID</p>
              <p className="font-medium">{user.staff_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{user.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <FileText className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Records Management
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage medical records and documentation
            </p>
            <button className="text-purple-600 font-medium text-sm hover:underline">
              View Records →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Calendar className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Appointments
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Schedule and manage appointments
            </p>
            <button className="text-purple-600 font-medium text-sm hover:underline">
              View Appointments →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Patient Directory
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Access patient information and contacts
            </p>
            <button className="text-purple-600 font-medium text-sm hover:underline">
              View Directory →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
