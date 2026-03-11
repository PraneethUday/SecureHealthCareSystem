"use client";

import { useState } from "react";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";

interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

export default function PatientDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/staff/patients/search?q=${encodeURIComponent(searchTerm)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
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
      {/* Search Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
            <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Patient Directory
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search for patients by name, phone number, email, or patient ID.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchPatients()}
              placeholder="Search by name, phone, email, or patient ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={searchPatients}
            disabled={loading || !searchTerm.trim()}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {patients.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Search Results ({patients.length} found)
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-sm">
                      {patient.first_name[0]}
                      {patient.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                        {patient.first_name} {patient.last_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {patient.patient_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="hidden sm:flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {patient.phone}
                    </span>
                    <span className="hidden md:flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {patient.email}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {patients.length === 0 && searchTerm && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <User className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No patients found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Try a different search term
          </p>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Patient Details
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-lg">
                  {selectedPatient.first_name[0]}
                  {selectedPatient.last_name[0]}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedPatient.patient_id}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs">Phone</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedPatient.phone}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-xs">Email</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {selectedPatient.email}
                    </p>
                  </div>
                </div>

                {selectedPatient.date_of_birth && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Date of Birth</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(
                        selectedPatient.date_of_birth,
                      ).toLocaleDateString()}{" "}
                      ({calculateAge(selectedPatient.date_of_birth)} years old)
                    </p>
                  </div>
                )}

                {selectedPatient.gender && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-xs">Gender</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                      {selectedPatient.gender}
                    </p>
                  </div>
                )}

                {(selectedPatient.address || selectedPatient.city) && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs">Address</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {[
                        selectedPatient.address,
                        selectedPatient.city,
                        selectedPatient.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                {selectedPatient.created_at && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
                    Patient since{" "}
                    {new Date(selectedPatient.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
