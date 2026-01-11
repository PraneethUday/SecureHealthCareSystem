"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getVideoCall } from "@/lib/webrtc-signaling";
import { CallPage } from "@/app/dashboard/components/CallPage";

export default function CallPageWrapper() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callData, setCallData] = useState<any>(null);

  const callId = params.callId as string;

  useEffect(() => {
    async function initializeCall() {
      try {
        const session = getSession(); // getSession is synchronous
        const currentUser = session?.user;

        if (!currentUser) {
          setError("You must be logged in to access this page");
          return;
        }

        setUser(currentUser);

        // Fetch call data to verify user is participant
        const call = await getVideoCall(callId);
        if (!call) {
          setError("Call not found");
          return;
        }

        // Verify user is a participant
        const userRole = session?.role;
        // Use UUID id field for both patient and doctor
        const userId = currentUser.id;
        const isParticipant =
          (call.patient_id === userId && userRole === "patient") ||
          (call.doctor_id === userId && userRole === "doctor");

        if (!isParticipant) {
          setError("You are not authorized to access this call");
          return;
        }

        setCallData(call);
      } catch (err) {
        console.error("[CallPageWrapper] Error initializing call:", err);
        setError("Failed to initialize call");
      } finally {
        setIsLoading(false);
      }
    }

    initializeCall();
  }, [callId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-white text-lg">Initializing call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm text-center">
          <svg
            className="w-12 h-12 text-red-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 4v2m-6-6a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!callData || !user) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <p className="text-white">Call data not found</p>
      </div>
    );
  }

  // Determine user role based on call data
  const session = getSession();
  // Use UUID id field for all roles
  const userId = user.id;
  const userRole = userId === callData.doctor_id ? "doctor" : "patient";

  return (
    <CallPage
      callId={callId}
      userId={userId}
      userRole={userRole}
      appointmentId={callData.appointment_id}
      remoteUserId={
        userId === callData.patient_id
          ? callData.doctor_id
          : callData.patient_id
      }
    />
  );
}
