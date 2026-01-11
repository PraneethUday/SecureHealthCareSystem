'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';

export interface CallPageProps {
  callId: string;
  userId: string;
  userRole: 'patient' | 'doctor';
  remoteUserId: string;
  appointmentId: string;
  isInitiator?: boolean; // True when patient is starting a new call
}

/**
 * Video call page component showing local and remote video streams
 * with call controls (mute, camera, end call)
 */
export function CallPage({
  callId,
  userId,
  userRole,
  remoteUserId,
  appointmentId,
  isInitiator = false,
}: CallPageProps) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const hasInitializedRef = useRef(false);

  const {
    callStatus,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    isConnected,
    callDuration,
    error,
    endCall,
    toggleAudio,
    toggleVideo,
    initiateCall,
    acceptCall,
  } = useWebRTC({
    userId,
    userRole,
    appointmentId,
  });

  // Initialize the call when the component mounts
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    console.log('[CallPage] 🎬 Initializing call:', { callId, userId, userRole, remoteUserId, isInitiator });

    if (userRole === 'doctor') {
      // Doctor accepts the existing call
      console.log('[CallPage] 👨‍⚕️ Doctor accepting call:', callId);
      acceptCall(callId, remoteUserId);
    } else if (isInitiator) {
      // Patient is starting a new call - initiate WebRTC
      console.log('[CallPage] 🤒 Patient initiating new call to:', remoteUserId);
      initiateCall(remoteUserId);
    } else {
      // Patient joining existing call (shouldn't normally happen)
      console.log('[CallPage] ⚠️ Patient on existing call page');
    }
  }, [callId, userId, userRole, remoteUserId, isInitiator, initiateCall, acceptCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[CallPage] 📹 Attaching local stream', {
        active: localStream.active,
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length
      });
      localVideoRef.current.srcObject = localStream;
      console.log('[CallPage] ✅ Local stream attached to video element');
    } else {
      console.log('[CallPage] ⏳ Waiting for local stream...', {
        hasVideoRef: !!localVideoRef.current,
        hasStream: !!localStream
      });
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('[CallPage] 📺 Attaching remote stream', {
        active: remoteStream.active,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length
      });
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('[CallPage] ✅ Remote stream attached to video element');
    } else {
      console.log('[CallPage] ⏳ Waiting for remote stream...', {
        hasVideoRef: !!remoteVideoRef.current,
        hasStream: !!remoteStream
      });
    }
  }, [remoteStream]);

  const handleEndCall = async () => {
    await endCall();
    router.back();
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

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 text-center">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 relative bg-gray-800">
        {/* Remote Video - Full Screen */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <p className="text-white text-lg">Waiting for {userRole === 'patient' ? 'doctor' : 'patient'} to connect...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video - Picture in Picture */}
        {localStream && (
          <div className="absolute bottom-24 right-4 w-32 h-32 sm:w-40 sm:h-40 bg-gray-800 rounded-lg border-2 border-white overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {/* Video Status Badges */}
            <div className="absolute top-2 left-2 flex gap-2">
              {isVideoDisabled && (
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Camera Off
                </div>
              )}
              {isAudioMuted && (
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Muted
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call Duration - Top Right */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg font-mono text-lg">
            {formatDuration(callDuration)}
          </div>
        )}

        {/* Call Status - Center Top */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
          {!isConnected && (
            <span>
              {callStatus === 'calling' && 'Calling...'}
              {callStatus === 'accepted' && 'Connecting...'}
              {callStatus === 'ringing' && 'Ringing...'}
            </span>
          )}
          {isConnected && <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Connected
          </span>}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-6 flex items-center justify-center gap-4">
        {/* Mute Button */}
        <button
          onClick={toggleAudio}
          disabled={!isConnected}
          className={`p-4 rounded-full transition-all ${
            isAudioMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
          } disabled:bg-gray-600 disabled:opacity-50 active:scale-95`}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 5.23 11.08 5 12 5c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l.98.98c.09-.04.23-.06.36-.09 1.68-.46 2.9-2.02 2.9-3.85-.07-1.25-.37-2.41-.87-3.44m-6.3.8l2.1 2.1.9-.9C15.5 11.56 16 9.88 16 8h-2.17l2.19-2.19c.63.68 1.17 1.53 1.47 2.5H16c0 .9-.11 1.78-.32 2.64zm7.6 4.4l1.41 1.41c.9-1.16 1.41-2.6 1.41-4.15h-2v2.74zM20.84 20.84L3.5 3.5A.9959.9959 0 0 0 2.1 5.1l6.36 6.36H4v3h5.17L13 19.9v2.02c1.21-.04 2.38-.4 3.47-1.01l2.6 2.6c1.95-1.49 3.44-3.67 4.04-6.09l2.6 2.6c.9-1.27 1.4-2.8 1.4-4.39 0-1.12-.23-2.19-.67-3.16z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.75 2.36-2.24 0-4.27-.9-5.75-2.36L4 18c1.86 1.48 4.3 2.35 7 2.35s5.14-.87 7-2.35l-1-1.09zM19.5 6c.83 0 1.5-.67 1.5-1.5S20.33 3 19.5 3 18 3.67 18 4.5s.67 1.5 1.5 1.5z" />
            </svg>
          )}
        </button>

        {/* Camera Button */}
        <button
          onClick={toggleVideo}
          disabled={!isConnected}
          className={`p-4 rounded-full transition-all ${
            isVideoDisabled
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
          } disabled:bg-gray-600 disabled:opacity-50 active:scale-95`}
          title={isVideoDisabled ? 'Turn on camera' : 'Turn off camera'}
          aria-label={isVideoDisabled ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoDisabled ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-11-7l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          )}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all"
          title="End call"
          aria-label="End call"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
