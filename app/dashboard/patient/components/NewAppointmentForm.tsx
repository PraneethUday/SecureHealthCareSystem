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
} from "lucide-react";
import {
  getHospitals,
  getDoctors,
  getAvailableTimeSlots,
  createAppointment,
} from "@/lib/appointments";
import { Hospital } from "@/lib/database.types";

interface NewAppointmentFormProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewAppointmentForm({
  patientId,
  onClose,
  onSuccess,
}: NewAppointmentFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data states
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Form states
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isTelemedicine, setIsTelemedicine] = useState(false);
  const [shareHealthProfile, setShareHealthProfile] = useState(false);

  // Load hospitals on mount
  useEffect(() => {
    loadHospitals();
  }, []);

  // Load doctors when hospital is selected and reset doctor selection
  useEffect(() => {
    if (selectedHospital) {
      setSelectedDoctor(""); // Reset doctor selection when hospital changes
      setDoctors([]); // Clear doctors list
      loadDoctors();
    }
  }, [selectedHospital]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load time slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedDoctor]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHospitals = async () => {
    setLoading(true);
    const data = await getHospitals();
    setHospitals(data);
    setLoading(false);
  };

  const loadDoctors = async () => {
    setLoading(true);
    const data = await getDoctors(selectedHospital);
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
    setError("");
    setLoading(true);

    const result = await createAppointment({
      patientId,
      doctorId: selectedDoctor,
      hospitalId: selectedHospital,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      reason,
      notes,
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
        return selectedHospital !== "";
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
              Book New Appointment
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Step {step} of 4
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s <= step
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${s < step ? "bg-red-500" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Hospital</span>
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

          {/* Step 1: Select Hospital */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500 dark:text-red-400" />
                Select Hospital
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitals.map((hospital) => (
                    <button
                      key={hospital.id}
                      onClick={() => setSelectedHospital(hospital.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedHospital === hospital.id
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-gray-800"
                        }`}
                    >
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                        {hospital.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hospital.address}, {hospital.city}, {hospital.state}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {hospital.phone}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Doctor */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-red-500 dark:text-red-400" />
                Select Doctor
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
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
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedDoctor === doctor.id
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500"
                          : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-gray-800"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-400">
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
                <Calendar className="w-5 h-5 text-red-500 dark:text-red-400" />
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent accent-red-500"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Time Slots
                  </label>
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
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
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedTime === slot
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-300 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
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
                      Connect with your doctor via secure video call for quick
                      consultations, follow-ups, or minor health concerns. Ideal
                      for non-emergency situations.
                    </p>
                    {isTelemedicine && (
                      <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-3 py-2 rounded">
                        ✓ Video call link will be provided before your
                        appointment
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Visit{" "}
                  <span className="text-gray-400 dark:text-gray-500">
                    (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Regular checkup, Follow-up, Consultation"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes{" "}
                  <span className="text-gray-400 dark:text-gray-500">
                    (Optional)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional information you'd like to share..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                      Share Health Profile
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Give the doctor access to your symptoms, allergies, and
                      health history to help them prepare for your visit.
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
                          <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          In-Person
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Hospital:
                    </span>
                    <span className="font-medium">
                      {hospitals.find((h) => h.id === selectedHospital)?.name}
                    </span>
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
                      Share Profile:
                    </span>
                    <span
                      className={`font-medium ${shareHealthProfile ? "text-rose-600" : "text-gray-400"}`}
                    >
                      {shareHealthProfile ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between rounded-b-xl">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
