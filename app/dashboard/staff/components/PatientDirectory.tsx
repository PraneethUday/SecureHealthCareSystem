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
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 dark:border-white/10 p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <User className="w-6 h-6 text-purple-500" />
          Patient Directory
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Search for patients by name, phone number, email, or patient ID.
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchPatients()}
              placeholder="Search by name, phone, email, or patient ID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={searchPatients}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {patients.length > 0 && (
        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 dark:border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Search Results ({patients.length} found)
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                      {patient.first_name[0]}
                      {patient.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                        {patient.first_name} {patient.last_name}
                      </h4>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        ID: {patient.patient_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {patient.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {patient.email}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {patients.length === 0 && searchTerm && !loading && (
        <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 dark:border-white/10 p-10 text-center">
          <User className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No patients found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Try a different search term
          </p>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Patient Details
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedPatient.first_name[0]}
                  {selectedPatient.last_name[0]}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h4>
                  <p className="text-purple-600 dark:text-purple-400 font-medium">
                    {selectedPatient.patient_id}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedPatient.phone}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {selectedPatient.email}
                    </p>
                  </div>
                </div>

                {selectedPatient.date_of_birth && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Date of Birth</span>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {new Date(
                        selectedPatient.date_of_birth,
                      ).toLocaleDateString()}{" "}
                      ({calculateAge(selectedPatient.date_of_birth)} years old)
                    </p>
                  </div>
                )}

                {selectedPatient.gender && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Gender</span>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                      {selectedPatient.gender}
                    </p>
                  </div>
                )}

                {(selectedPatient.address || selectedPatient.city) && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Address</span>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
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
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                    Patient since{" "}
                    {new Date(selectedPatient.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
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
