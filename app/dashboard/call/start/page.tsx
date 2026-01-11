'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { useWebRTC } from '@/hooks/useWebRTC';

/**
 * Call start page for patients
 * This page initiates the call with camera/microphone permissions
 * and creates the call record, then shows the call interface
 */
export default function CallStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const appointmentId = searchParams.get('appointmentId');
  const doctorId = searchParams.get('doctorId');

  const {
    callId,
    callStatus,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    isConnected,
    isInitiating,
    callDuration,
    error: hookError,
    endCall,
    toggleAudio,
    toggleVideo,
    initiateCall,
  } = useWebRTC({
    userId: user?.id || '',
    userRole: 'patient',
    appointmentId: appointmentId || undefined,
  });

  // Check session
  useEffect(() => {
    async function checkUser() {
      const session = getSession();
      if (!session || session.role !== 'patient') {
        setError('You must be logged in as a patient');
        return;
      }

      if (!appointmentId || !doctorId) {
        setError('Missing appointment or doctor information');
        return;
      }

      setUser(session.user);
      setIsLoading(false);
    }
    checkUser();
  }, [appointmentId, doctorId]);

  // Initiate the call once user is loaded
  useEffect(() => {
    if (hasInitializedRef.current || !user || !doctorId || isInitiating) return;
    hasInitializedRef.current = true;

    console.log('[CallStart] Initiating call to doctor:', doctorId);
    initiateCall(doctorId);
  }, [user, doctorId, isInitiating, initiateCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[CallStart] Attaching local stream to video element');
      console.log('[CallStart] Local stream details:', {
        id: localStream.id,
        active: localStream.active,
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length,
      });
      
      localVideoRef.current.srcObject = localStream;
      console.log('[CallStart] ✅ Local stream attached to video element');
      
      // Force play in case autoplay is blocked
      localVideoRef.current.play().catch(err => {
        console.warn('[CallStart] Could not autoplay local video:', err);
      });
    } else {
      console.log('[CallStart] Waiting for local stream...', {
        hasVideoRef: !!localVideoRef.current,
        hasLocalStream: !!localStream,
      });
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('[CallStart] Remote stream attached');
    }
  }, [remoteStream]);

  // Handle errors
  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  const handleEndCall = async () => {
    await endCall();
    router.push('/dashboard/patient');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <svg
            className="w-16 h-16 text-red-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/patient')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24">
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
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show initiating UI
  if (isInitiating || !callId) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="mb-6">
            {/* Camera Icon with Animation */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Starting Video Call</h2>
          <p className="text-gray-600 mb-4">
            Please allow access to your camera and microphone when prompted
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
            <span className="font-medium">Requesting permissions...</span>
          </div>

          <button
            onClick={() => router.push('/dashboard/patient')}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show call interface once initiated
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Status Bar */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
          <span className="text-white font-medium">
            {isConnected ? 'Connected' : callStatus === 'calling' ? 'Calling...' : 'Connecting...'}
          </span>
          {isConnected && (
            <span className="text-gray-400 text-sm">
              {formatDuration(callDuration)}
            </span>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Remote Video (Doctor) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-400">Waiting for doctor...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
            <span className="text-white text-sm font-medium">Doctor</span>
          </div>
        </div>

        {/* Local Video (You) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
            <span className="text-white text-sm font-medium">You</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-6 flex items-center justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isAudioMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            isVideoDisabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isVideoDisabled ? 'Enable Video' : 'Disable Video'}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isVideoDisabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title="End Call"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
