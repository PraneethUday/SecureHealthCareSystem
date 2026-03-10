"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  X,
  Loader2,
  Video,
  Heart,
  Search,
  Phone,
  Mail,
} from "lucide-react";
import {
  getDoctors,
  getAvailableTimeSlots,
  createAppointment,
} from "@/lib/appointments";

interface StaffAppointmentFormProps {
  staffId: string;
  hospitalId: string;
  hospitalName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function StaffAppointmentForm({
  staffId,
  hospitalId,
  hospitalName,
  onClose,
  onSuccess,
}: StaffAppointmentFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Data states
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Form states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isTelemedicine, setIsTelemedicine] = useState(false);
  const [shareHealthProfile, setShareHealthProfile] = useState(false);

  // Load doctors for the hospital
  useEffect(() => {
    if (hospitalId) {
      loadDoctors();
    }
  }, [hospitalId]);

  // Load time slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedDoctor]);

  const searchPatients = async () => {
    if (!patientSearch.trim()) return;

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/staff/patients/search?q=${encodeURIComponent(patientSearch)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    const data = await getDoctors(hospitalId);
    setDoctors(data);
    setLoading(false);
  };

  const loadTimeSlots = async () => {
    setLoading(true);
    const slots = await getAvailableTimeSlots(selectedDoctor, selectedDate);
    setTimeSlots(slots);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;

    setError("");
    setLoading(true);

    const result = await createAppointment({
      patientId: selectedPatient.id,
      doctorId: selectedDoctor,
      hospitalId: hospitalId,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      reason,
      notes: `[Booked by Staff: ${staffId}] ${notes}`,
      isTelemedicine,
      shareHealthProfile,
    });

    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Failed to create appointment");
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedPatient !== null;
      case 2:
        return selectedDoctor !== "";
      case 3:
        return selectedDate !== "" && selectedTime !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  const minDate = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Book Appointment for Patient
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Step {step} of 4 • {hospitalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s <= step
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? "bg-purple-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Patient</span>
            <span>Doctor</span>
            <span>Date & Time</span>
            <span>Details</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Search & Select Patient */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                Search Patient
              </h3>

              {/* Search Box */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchPatients()}
                    placeholder="Search by name, phone, or email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={searchPatients}
                  disabled={searchLoading || !patientSearch.trim()}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {searchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {/* Selected Patient */}
              {selectedPatient && (
                <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {selectedPatient.patient_id}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {selectedPatient.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {selectedPatient.email}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Patient Search Results */}
              {!selectedPatient && patients.length > 0 && (
                <div className="space-y-3">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="w-full text-left p-4 rounded-lg border-2 transition-all border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                            {patient.first_name} {patient.last_name}
                          </h4>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            ID: {patient.patient_id}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                          <p className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {patient.phone}
                          </p>
                          <p className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {patient.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!selectedPatient &&
                patients.length === 0 &&
                patientSearch &&
                !searchLoading && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No patients found. Try a different search term.
                  </p>
                )}
            </div>
          )}

          {/* Step 2: Select Doctor */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                Select Doctor at {hospitalName}
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {doctors.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No doctors available at this hospital.
                    </p>
                  ) : (
                    doctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedDoctor === doctor.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </h4>
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                              {doctor.specialization}
                            </p>
                            {doctor.years_of_experience && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {doctor.years_of_experience} years experience
                              </p>
                            )}
                          </div>
                          {doctor.consultation_fee && (
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              ₹{doctor.consultation_fee}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                Select Date & Time
              </h3>

              <div className="mb-6">
                <label
                  htmlFor="appointment-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Appointment Date
                </label>
                <input
                  id="appointment-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent accent-purple-500"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Time Slots
                  </label>
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No available slots for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedTime === slot
                              ? "border-purple-500 bg-purple-500 text-white"
                              : "border-gray-300 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Appointment Details
              </h3>

              {/* Telemedicine Toggle */}
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="telemedicine"
                    checked={isTelemedicine}
                    onChange={(e) => setIsTelemedicine(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="telemedicine"
                      className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                    >
                      <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Telemedicine (Video Consultation)
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Enable video consultation for this appointment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Visit
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Regular checkup, Follow-up, Consultation"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Share Health Profile Toggle */}
              <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="share-profile"
                    checked={shareHealthProfile}
                    onChange={(e) => setShareHealthProfile(e.target.checked)}
                    className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="share-profile"
                      className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                    >
                      <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      Share Patient&apos;s Health Profile
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Give the doctor access to patient&apos;s health history.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Appointment Summary
                </h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Patient:
                    </span>
                    <span className="font-medium">
                      {selectedPatient?.first_name} {selectedPatient?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Hospital:
                    </span>
                    <span className="font-medium">{hospitalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Doctor:
                    </span>
                    <span className="font-medium">
                      Dr.{" "}
                      {doctors.find((d) => d.id === selectedDoctor)?.first_name}{" "}
                      {doctors.find((d) => d.id === selectedDoctor)?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="font-medium">
                      {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Time:
                    </span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Type:
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      {isTelemedicine ? (
                        <>
                          <Video className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600">Telemedicine</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          In-Person
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
