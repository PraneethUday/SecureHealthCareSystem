"use client";

/**
 * VideoRoom Component
 * UI for video calling with local/remote video, controls, and participant info
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from "lucide-react";

interface VideoRoomProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isConnected: boolean;
  participantCount: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  error: string | null;
}

export function VideoRoom({
  localStream,
  remoteStreams,
  audioEnabled,
  videoEnabled,
  isConnected,
  participantCount,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  error,
}: VideoRoomProps) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle leave and redirect
  const handleLeave = async () => {
    await onLeave();
    router.push("/dashboard");
  };

  // Get the primary remote stream (first one)
  const primaryRemoteStream = remoteStreams.size > 0 
    ? Array.from(remoteStreams.values())[0] 
    : null;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            <span className="text-sm">{participantCount} participant(s)</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        {error && (
          <div className="bg-red-500 text-white px-3 py-1 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative p-4">
        {/* Remote Video (Large) */}
        <div className="w-full h-full flex items-center justify-center">
          {primaryRemoteStream ? (
            <RemoteVideo stream={primaryRemoteStream} />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Users className="w-16 h-16 mb-4" />
              <p className="text-lg">Waiting for other participant...</p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <VideoOff className="w-8 h-8" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleAudio}
            className={`p-4 rounded-full transition-colors ${
              audioEnabled
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={audioEnabled ? "Mute" : "Unmute"}
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Video On/Off */}
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-full transition-colors ${
              videoEnabled
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={handleLeave}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Remote Video Component
 * Handles attaching remote stream to video element
 */
function RemoteVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="max-w-full max-h-full rounded-lg"
    />
  );
}

/**
 * Loading/Joining Screen
 */
export function VideoRoomJoining() {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-white text-lg">Joining video call...</p>
      <p className="text-gray-400 text-sm mt-2">Please allow camera and microphone access</p>
    </div>
  );
}

/**
 * Error Screen
 */
export function VideoRoomError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-red-500/20 p-4 rounded-full mb-4">
        <VideoOff className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-white text-xl font-semibold mb-2">Unable to join call</h2>
      <p className="text-gray-400 text-center mb-6 max-w-md">{error}</p>
      <div className="flex gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
