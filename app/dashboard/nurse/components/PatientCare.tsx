"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Stethoscope,
  Heart,
  Activity,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import PatientProfileModal from "@/components/PatientProfileModal";
import NurseVitalsForm from "./NurseVitalsForm";
import VitalsViewer from "@/app/dashboard/doctor/components/VitalsViewer";

interface AssignedPatient {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_dob: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  hospital_name: string;
  updated_at: string;
  share_health_profile?: boolean;
  patient_uuid: string;
  isNew?: boolean;
}

interface PatientCareProps {
  nurseId: string;
}

export function PatientCare({ nurseId }: PatientCareProps) {
  const [patients, setPatients] = useState<AssignedPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("today");
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState<{
    patientId: string;
    patientName: string;
  } | null>(null);
  const [showVitalsViewer, setShowVitalsViewer] = useState<{
    patientId: string;
    patientName: string;
  } | null>(null);

  const fetchAssignedPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get nurse UUID from nurse_id
      const { data: nurseData, error: nurseError } = await supabase
        .from("nurses")
        .select("id")
        .eq("nurse_id", nurseId)
        .single();

      if (nurseError || !nurseData) {
        console.error("Nurse not found:", nurseError);
        setPatients([]);
        setIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Build query based on filter
      let query = supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          reason,
          patients!inner (
            id,
            patient_id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          ),
          doctors!inner (
            id,
            doctor_id,
            first_name,
            last_name,
            specialization
          ),
          hospitals!inner (
            name
          ),
          updated_at,
          share_health_profile
        `,
        )
        .eq("nurse_id", nurseData.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (filter === "today") {
        query = query.eq("appointment_date", today).in("status", ["scheduled"]);
      } else if (filter === "upcoming") {
        query = query
          .gte("appointment_date", today)
          .in("status", ["scheduled"]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching assigned patients:", error);
        setPatients([]);
      } else {
        const formattedPatients = (data || []).map((apt: any) => {
          const updatedAt = new Date(apt.updated_at);
          const now = new Date();
          const isNew =
            now.getTime() - updatedAt.getTime() < 24 * 60 * 60 * 1000; // 24 hours

          return {
            appointment_id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            status: apt.status,
            reason: apt.reason || "General consultation",
            patient_id: apt.patients?.patient_id || "",
            patient_name: `${apt.patients?.first_name} ${apt.patients?.last_name}`,
            patient_email: apt.patients?.email || "",
            patient_phone: apt.patients?.phone || "",
            patient_dob: apt.patients?.date_of_birth || "",
            doctor_id: apt.doctors?.doctor_id || "",
            doctor_name: `Dr. ${apt.doctors?.first_name} ${apt.doctors?.last_name}`,
            doctor_specialization: apt.doctors?.specialization || "",
            hospital_name: apt.hospitals?.name || "",
            updated_at: apt.updated_at,
            share_health_profile: apt.share_health_profile,
            patient_uuid: apt.patients?.id || "",
            isNew,
          };
        });
        setPatients(formattedPatients);
      }
    } catch (error) {
      console.error("Error:", error);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [nurseId, filter]);

  useEffect(() => {
    fetchAssignedPatients();
  }, [fetchAssignedPatients]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getAge = (dob: string) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Patient Care
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              View and manage your assigned patients
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(["today", "upcoming", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {f === "today" ? "Today" : f === "upcoming" ? "Upcoming" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && patients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            No Patients Assigned
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You don&apos;t have any assigned patients for the selected filter.
          </p>
        </div>
      )}

      {/* Patients List */}
      {!isLoading && patients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient) => (
            <div
              key={patient.appointment_id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors p-5"
            >
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-2">
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {patient.patient_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {patient.patient_id} &bull; Age:{" "}
                      {getAge(patient.patient_dob)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      patient.status === "scheduled"
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    {patient.status.toUpperCase()}
                  </span>
                  {patient.isNew && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                      New
                    </span>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{formatDate(patient.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{formatTime(patient.appointment_time)}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5">
                  <Stethoscope className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Assigned By
                    </p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {patient.doctor_name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {patient.doctor_specialization}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{patient.hospital_name}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 mb-4 border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Reason:
                  </span>{" "}
                  {patient.reason}
                </p>
              </div>

              {/* Shared Health Profile Banner */}
              {patient.share_health_profile && (
                <div className="flex items-center justify-between gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl px-3 py-2.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                        Health Profile Shared
                      </p>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400">
                        Patient shared their medical history.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(patient.patient_id)}
                    className="px-2.5 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              )}

              {/* Vitals Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() =>
                    setShowVitalsForm({
                      patientId: patient.patient_uuid,
                      patientName: patient.patient_name,
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Record Vitals
                </button>
                <button
                  onClick={() =>
                    setShowVitalsViewer({
                      patientId: patient.patient_uuid,
                      patientName: patient.patient_name,
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Vitals
                </button>
              </div>

              {/* Contact Info */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{patient.patient_phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">
                    {patient.patient_email}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {!isLoading && patients.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {patients.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filter === "today"
                    ? "Today's Patients"
                    : filter === "upcoming"
                      ? "Upcoming Patients"
                      : "Total Assigned Patients"}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAssignedPatients}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Patient Profile Modal */}
      {showProfileModal && (
        <PatientProfileModal
          patientId={
            patients.find((p) => p.patient_id === showProfileModal)
              ?.patient_uuid || ""
          }
          onClose={() => setShowProfileModal(null)}
        />
      )}

      {/* Nurse Vitals Form Modal */}
      {showVitalsForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <NurseVitalsForm
              patientId={showVitalsForm.patientId}
              patientName={showVitalsForm.patientName}
              nurseId={nurseId}
              onClose={() => setShowVitalsForm(null)}
              onSuccess={() => setShowVitalsForm(null)}
            />
          </div>
        </div>
      )}

      {/* Vitals Viewer Modal */}
      {showVitalsViewer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Patient Vitals
                </h2>
                <p className="text-xs text-slate-500">{showVitalsViewer.patientName}</p>
              </div>
              <button
                onClick={() => setShowVitalsViewer(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-slate-500 text-lg font-bold leading-none">&times;</span>
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-70px)]">
              <VitalsViewer
                patientId={showVitalsViewer.patientId}
                patientName={showVitalsViewer.patientName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
