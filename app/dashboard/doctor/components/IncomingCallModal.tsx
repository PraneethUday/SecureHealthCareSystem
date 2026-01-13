"use client";

import { useEffect, useState } from "react";
import {
  subscribeToIncomingCalls,
  VideoCall,
} from "@/lib/webrtc-signaling";

export interface IncomingCallModalProps {
  doctorId: string;
  onCallAccepted: (call: VideoCall) => void;
  onCallRejected: (callId: string) => void;
}

export function IncomingCallModal({
  doctorId,
  onCallAccepted,
  onCallRejected,
}: IncomingCallModalProps) {
  const [incomingCall, setIncomingCall] = useState<VideoCall | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    console.log(
      "[IncomingCallModal] Setting up subscription for doctor:",
      doctorId
    );

    // Subscribe to incoming calls
    unsubscribe = subscribeToIncomingCalls(
      doctorId,
      async (call) => {
        console.log("[IncomingCallModal] New incoming call:", call.id);

        // Fetch patient name from appointment
        try {
          const response = await fetch(
            `/api/appointments/${call.appointment_id}/details`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setPatientName(data.patient_name || "Unknown Patient");
          }
        } catch (error) {
          console.error(
            "[IncomingCallModal] Error fetching patient info:",
            error
          );
          setPatientName("Patient");
        }

        setIncomingCall(call);
      },
      (error) => {
        console.error("[IncomingCallModal] Subscription error:", error);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [doctorId]);

  const handleAccept = async () => {
    if (!incomingCall) return;

    try {
      setIsAccepting(true);
      console.log("[IncomingCallModal] Doctor accepting call:", incomingCall.id);

      // Don't update status here - let useWebRTC.acceptCall() handle it
      // Just navigate to the call page
      onCallAccepted(incomingCall);
      setIncomingCall(null);
    } catch (error) {
      console.error("[IncomingCallModal] Error accepting call:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!incomingCall) return;

    try {
      setIsRejecting(true);

      // Update call status to rejected
      const result = await updateCallStatus(
        incomingCall.id,
        "rejected",
        doctorId,
        "doctor"
      );

      if (result.success) {
        onCallRejected(incomingCall.id);
        setIncomingCall(null);
      }
    } catch (error) {
      console.error("[IncomingCallModal] Error rejecting call:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg text-center">
          <div className="text-2xl font-bold mb-2">Incoming Call</div>
          <div className="text-lg font-semibold">{patientName}</div>
          <div className="text-sm opacity-90 mt-2">from patient</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.418 1.265 1.215 2.807 2.453 4.045 1.238 1.238 2.78 2.035 4.045 2.453l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">
              {patientName} is calling you for a video consultation
            </p>
          </div>

          {/* Call Details */}
          <div className="bg-gray-50 rounded p-4 mb-6 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Time:</span>
              <span className="font-semibold">
                {new Date(incomingCall.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Appointment:</span>
              <span className="font-semibold">
                {incomingCall.appointment_id.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReject}
              disabled={isRejecting || isAccepting}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
            >
              {isRejecting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-1 animate-spin"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Rejecting
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reject
                </span>
              )}
            </button>

            <button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
            >
              {isAccepting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-1 animate-spin"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Accepting
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.418 1.265 1.215 2.807 2.453 4.045 1.238 1.238 2.78 2.035 4.045 2.453l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Accept
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
