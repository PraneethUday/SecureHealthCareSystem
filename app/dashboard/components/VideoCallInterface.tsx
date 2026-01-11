"use client";

import { useState, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  X,
} from "lucide-react";
import { startVideoCall, endVideoCall } from "@/lib/prescriptions";
import { AppointmentWithDetails } from "@/lib/database.types";

interface VideoCallInterfaceProps {
  appointment: AppointmentWithDetails;
  userId: string;
  userRole: "patient" | "doctor";
  onClose: () => void;
  onCallEnded: () => void;
}

export default function VideoCallInterface({
  appointment,
  userId,
  userRole,
  onClose,
  onCallEnded,
}: VideoCallInterfaceProps) {
  const [callStarted, setCallStarted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callLink, setCallLink] = useState("");
  const [error, setError] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Start call duration timer when call is active
    if (callStarted) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStarted]);

  const handleStartCall = async () => {
    setError("");
    const result = await startVideoCall(
      appointment.id,
      appointment.patient_id,
      appointment.doctor_id
    );

    if (result.success && result.callLink) {
      setCallLink(result.callLink);
      setCallStarted(true);
      // In production, integrate with actual video service (Twilio, Agora, etc.)
      window.open(result.callLink, "_blank");
    } else {
      setError(result.error || "Failed to start video call");
    }
  };

  const handleEndCall = async () => {
    await endVideoCall(appointment.id);
    setCallStarted(false);
    onCallEnded();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Telemedicine Video Call</h2>
            <p className="text-sm text-blue-100">
              {userRole === "doctor"
                ? `Patient: ${appointment.patient_name}`
                : `Dr. ${appointment.doctor_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
            aria-label="Close video call"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Video Area */}
        <div className="p-6">
          <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4 relative">
            {callStarted ? (
              <>
                {/* Simulated video area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video call in progress...</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Duration: {formatDuration(callDuration)}
                    </p>
                  </div>
                </div>
                {/* Small preview of own video (top-right corner) */}
                <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-white">
                  <div className="text-white text-xs">You</div>
                </div>
              </>
            ) : (
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Ready to connect</p>
                <p className="text-sm text-gray-400">
                  Click "Start Call" to begin video consultation
                </p>
              </div>
            )}
          </div>

          {/* Call Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-gray-600 font-medium">Date & Time</p>
              <p className="text-gray-800">
                {new Date(
                  `${appointment.appointment_date}T${appointment.appointment_time}`
                ).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-gray-600 font-medium">Type</p>
              <p className="text-blue-600 font-semibold">Telemedicine</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!callStarted ? (
              <button
                onClick={handleStartCall}
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 text-lg font-semibold"
              >
                <Video className="w-6 h-6" />
                Start Call
              </button>
            ) : (
              <>
                <button
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`p-4 rounded-full transition ${
                    videoEnabled
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={videoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {videoEnabled ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <VideoOff className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-4 rounded-full transition ${
                    audioEnabled
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={audioEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {audioEnabled ? (
                    <Mic className="w-6 h-6" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={() => {}}
                  className="p-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                  title="Share screen"
                >
                  <Monitor className="w-6 h-6" />
                </button>

                <button
                  onClick={handleEndCall}
                  className="px-8 py-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition flex items-center gap-2"
                  title="End call"
                >
                  <PhoneOff className="w-6 h-6" />
                  End Call
                </button>
              </>
            )}
          </div>

          {/* Note about production */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              💡 This is a demo interface. In production, this would integrate
              with a real video service like Twilio, Agora, or WebRTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
