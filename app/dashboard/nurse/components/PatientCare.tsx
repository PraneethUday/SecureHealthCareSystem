"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Calendar, Clock, MapPin, User, Phone, Mail, Stethoscope, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PatientProfileModal from "@/components/PatientProfileModal";

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
        `
        )
        .eq("nurse_id", nurseData.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (filter === "today") {
        query = query.eq("appointment_date", today).in("status", ["scheduled"]);
      } else if (filter === "upcoming") {
        query = query.gte("appointment_date", today).in("status", ["scheduled"]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching assigned patients:", error);
        setPatients([]);
      } else {
        const formattedPatients = (data || []).map((apt: any) => {
          const updatedAt = new Date(apt.updated_at);
          const now = new Date();
          const isNew = (now.getTime() - updatedAt.getTime()) < (24 * 60 * 60 * 1000); // 24 hours

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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Care</h2>
            <p className="text-sm text-gray-600">
              View and manage your assigned patients
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("today")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "today"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "upcoming"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "all"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && patients.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Patients Assigned
          </h3>
          <p className="text-gray-500">
            You don&apos;t have any assigned patients for the selected filter.
          </p>
        </div>
      )}

      {/* Patients List */}
      {!isLoading && patients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patients.map((patient) => (
            <div
              key={patient.appointment_id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
            >
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {patient.patient_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {patient.patient_id} • Age: {getAge(patient.patient_dob)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${patient.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {patient.status.toUpperCase()}
                  </span>
                  {patient.isNew && (
                    <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full animate-pulse uppercase tracking-tighter">
                      New Assignment
                    </span>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{formatDate(patient.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>{formatTime(patient.appointment_time)}</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Assigned By</p>
                    <p className="text-sm font-bold text-gray-800">{patient.doctor_name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{patient.doctor_specialization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>{patient.hospital_name}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Reason:</span>{" "}
                  {patient.reason}
                </p>
              </div>

              {/* Shared Health Profile Banner */}
              {patient.share_health_profile && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-100 p-2 rounded-lg">
                        <Heart className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-900">Health Profile Shared</p>
                        <p className="text-xs text-rose-700">Patient shared their medical history.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(patient.patient_id)}
                      className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span>{patient.patient_phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-green-500" />
                  <span className="truncate max-w-[150px]">{patient.patient_email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {!isLoading && patients.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                <p className="text-sm text-gray-600">
                  {filter === "today" ? "Today's Patients" : filter === "upcoming" ? "Upcoming Patients" : "Total Assigned Patients"}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAssignedPatients}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Patient Profile Modal */}
      {showProfileModal && (
        <PatientProfileModal
          patientId={patients.find(p => p.patient_id === showProfileModal)?.patient_uuid || ""}
          onClose={() => setShowProfileModal(null)}
        />
      )}
    </div>
  );
}
