"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PeerConnection } from "@/lib/webrtc-peer-connection";
import {
  createVideoCall,
  sendSignalingMessage,
  subscribeToSignalingMessages,
  updateCallStatus,
  getVideoCall,
  endVideoCall,
  getRecentSignalingMessages,
  SignalingMessage,
  VideoCall,
  CallStatus,
} from "@/lib/webrtc-signaling";

export interface UseWebRTCOptions {
  userId: string;
  userRole: "patient" | "doctor";
  appointmentId?: string;
}

export interface UseWebRTCState {
  // Call state
  callId: string | null;
  callStatus: CallStatus | null;
  isInitiating: boolean;
  isAccepting: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;

  // Media state
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;

  // Call info
  remoteParticipant: { id: string; role: "patient" | "doctor" } | null;
  callDuration: number; // seconds
}

export function useWebRTC(options: UseWebRTCOptions) {
  const { userId, userRole, appointmentId } = options;

  // State
  const [state, setState] = useState<UseWebRTCState>({
    callId: null,
    callStatus: null,
    isInitiating: false,
    isAccepting: false,
    isConnecting: false,
    isConnected: false,
    error: null,
    localStream: null,
    remoteStream: null,
    isAudioMuted: false,
    isVideoDisabled: false,
    remoteParticipant: null,
    callDuration: 0,
  });

  // Refs
  const peerConnectionRef = useRef<PeerConnection | null>(null);
  const unsubscribeSignalingRef = useRef<(() => void) | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remoteDescriptionSettingRef = useRef<boolean>(false);
  const isInitializingMediaRef = useRef<boolean>(false);

  /**
   * Initialize local media - returns stream without setState to avoid re-renders
   */
  const initializeLocalMedia =
    useCallback(async (): Promise<MediaStream | null> => {
      try {
        // Prevent multiple simultaneous initializations
        if (isInitializingMediaRef.current) {
          console.log("[Hook] ⚠️  Media initialization already in progress");
          return null;
        }

        isInitializingMediaRef.current = true;
        console.log(
          "[Hook] 🎥 Initializing local media (camera & microphone)..."
        );

        // Create or recreate peer connection if needed
        if (!peerConnectionRef.current) {
          console.log("[Hook] Creating new PeerConnection...");
          try {
            peerConnectionRef.current = new PeerConnection();
            console.log("[Hook] ✅ PeerConnection created successfully");
            console.log(
              "[Hook] PeerConnection object:",
              peerConnectionRef.current
            );
            console.log(
              "[Hook] PeerConnection type:",
              typeof peerConnectionRef.current
            );
          } catch (err) {
            console.error("[Hook] ❌ Error creating PeerConnection:", err);
            isInitializingMediaRef.current = false;
            return null;
          }
        } else {
          console.log("[Hook] Reusing existing PeerConnection");
        }

        // Verify peer connection was created
        if (!peerConnectionRef.current) {
          console.error("[Hook] ❌ Failed to create peer connection!");
          isInitializingMediaRef.current = false;
          return null;
        }

        // If we already have a local stream, reuse it
        if (state.localStream && state.localStream.active) {
          console.log("[Hook] ✅ Reusing existing local stream");
          isInitializingMediaRef.current = false;
          return state.localStream;
        }

        // Setup event handlers (safe to call multiple times)
        peerConnectionRef.current.onRemoteStreamHandler((stream) => {
          console.log("[Hook] 📹 Remote stream received");
          setState((prev) => ({
            ...prev,
            remoteStream: stream,
            isConnected: true,
          }));
        });

        peerConnectionRef.current.onConnectionStateChangeHandler(
          (connectionState) => {
            console.log("[Hook] 🔗 Connection state changed:", connectionState);
            if (connectionState === "connected") {
              setState((prev) => ({ ...prev, isConnected: true }));
            } else if (
              connectionState === "failed" ||
              connectionState === "disconnected" ||
              connectionState === "closed"
            ) {
              setState((prev) => ({ ...prev, isConnected: false }));
            }
          }
        );

        peerConnectionRef.current.onErrorHandler((error) => {
          console.error("[Hook] ❌ WebRTC error:", error);
          setState((prev) => ({
            ...prev,
            error: error.message,
            isConnecting: false,
            isConnected: false,
          }));
        });

        console.log("[Hook] 📸 Requesting camera and microphone access...");
        console.log(
          "[Hook] ⚠️  Your browser should show a permission prompt now!"
        );

        const localStream = await peerConnectionRef.current.getLocalStream(
          true,
          true
        );

        if (!localStream) {
          console.warn("[Hook] ⚠️  No local stream obtained");
          isInitializingMediaRef.current = false;
          return null;
        }

        console.log("[Hook] ✅ Camera and microphone access granted!");
        console.log("[Hook] 📊 Stream tracks:", {
          video: localStream.getVideoTracks().length,
          audio: localStream.getAudioTracks().length,
        });

        isInitializingMediaRef.current = false;
        return localStream;
      } catch (error) {
        isInitializingMediaRef.current = false;
        const message =
          error instanceof Error ? error.message : "Failed to get local media";
        console.error("[Hook] ❌ Error initializing media:", error);

        // Set error in state for display
        if (message.includes("Permission denied")) {
          console.error("[Hook] 🚫 Camera/microphone permission was denied");
          setState((prev) => ({
            ...prev,
            error:
              "Camera/microphone permission denied. Please allow access and try again.",
          }));
        } else if (
          message.includes("not found") ||
          message.includes("Could not start")
        ) {
          console.error("[Hook] 📷 No camera or microphone found");
          setState((prev) => ({
            ...prev,
            error:
              "No camera or microphone found. Please connect a device and try again.",
          }));
        } else {
          console.error(
            "[Hook] 💡 Tip: Check if you denied camera/microphone permissions"
          );
          setState((prev) => ({ ...prev, error: message }));
        }
        return null;
      }
    }, []);

  /**
   * Initiate a call (patient side)
   */
  const initiateCall = useCallback(
    async (doctorId: string) => {
      try {
        if (!appointmentId) {
          setState((prev) => ({ ...prev, error: "Appointment ID required" }));
          return;
        }

        setState((prev) => ({ ...prev, isInitiating: true, error: null }));

        // Initialize local media first
        const localStream = await initializeLocalMedia();
        if (!localStream) {
          setState((prev) => ({
            ...prev,
            isInitiating: false,
            error: "Failed to access camera/microphone",
          }));
          return;
        }

        console.log(
          "[Hook] ✅ Media ready, peer connection exists:",
          !!peerConnectionRef.current
        );

        // Create video call record
        const callResult = await createVideoCall(
          appointmentId,
          userId,
          doctorId,
          userRole
        );
        if (!callResult.success || !callResult.videoCallId) {
          setState((prev) => ({
            ...prev,
            isInitiating: false,
            error: callResult.error || "Failed to create video call",
          }));
          return;
        }

        const callId = callResult.videoCallId;
        console.log("[Hook] Call created:", callId);

        // Verify peer connection still exists BEFORE setState
        if (!peerConnectionRef.current) {
          throw new Error("Peer connection lost after initialization");
        }

        // Setup ICE candidate handler BEFORE creating offer (and before setState)
        console.log(
          "[Hook] 🧊 Setting up ICE candidate handler for patient..."
        );
        peerConnectionRef.current.onIceCandidateHandler(async (candidate) => {
          console.log("[Hook] 🧊 Patient sending ICE candidate to doctor");
          await sendSignalingMessage(
            callId,
            userId,
            userRole,
            doctorId,
            "ice-candidate",
            {
              candidate: candidate.candidate,
              sdpMLineIndex: candidate.sdpMLineIndex,
              sdpMid: candidate.sdpMid,
            }
          );
        });

        // Subscribe to signaling messages
        console.log("[Hook] 📡 Subscribing to signaling messages...");
        unsubscribeSignalingRef.current = subscribeToSignalingMessages(
          callId,
          (message) => handleSignalingMessage(callId, message, doctorId),
          (error) => {
            setState((prev) => ({ ...prev, error: error.message }));
          }
        );

        // Now update state with everything including local stream
        setState((prev) => ({
          ...prev,
          callId,
          callStatus: "calling",
          isConnecting: true,
          error: null,
          localStream,
          remoteParticipant: { id: doctorId, role: "doctor" },
        }));

        console.log(
          "[Hook] ✅ State updated, peer connection still exists:",
          !!peerConnectionRef.current
        );

        // Create and send SDP offer
        const offer = await peerConnectionRef.current!.createOffer();
        await sendSignalingMessage(
          callId,
          userId,
          userRole,
          doctorId,
          "offer",
          {
            type: offer.type,
            sdp: offer.sdp,
          }
        );

        // Start call duration timer
        startCallDurationTimer();

        setState((prev) => ({
          ...prev,
          isInitiating: false,
          callStatus: "calling",
        }));

        console.log("[Hook] Call initiated successfully");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error initiating call";
        console.error("[Hook] Error initiating call:", error);
        setState((prev) => ({
          ...prev,
          isInitiating: false,
          isConnecting: false,
          error: message,
        }));
      }
    },
    [appointmentId, userId, userRole]
  );

  /**
   * Accept incoming call (doctor side)
   */
  const acceptCall = useCallback(
    async (callId: string, patientId: string) => {
      try {
        console.log(
          "[Hook] 👨‍⚕️ Doctor accepting call:",
          callId,
          "from patient:",
          patientId
        );
        setState((prev) => ({ ...prev, isAccepting: true, error: null }));

        // Initialize local media
        console.log("[Hook] 🎥 Initializing doctor's camera and microphone...");
        const localStream = await initializeLocalMedia();
        if (!localStream) {
          console.error("[Hook] ❌ Failed to initialize media for doctor");
          setState((prev) => ({
            ...prev,
            isAccepting: false,
            error: "Failed to access camera/microphone",
          }));
          return;
        }
        console.log("[Hook] ✅ Doctor's media initialized successfully");
        console.log(
          "[Hook] ✅ Peer connection exists:",
          !!peerConnectionRef.current
        );

        // Update call status to accepted
        console.log("[Hook] 📝 Updating call status to accepted...");
        const updateResult = await updateCallStatus(
          callId,
          "accepted",
          userId,
          userRole
        );
        if (!updateResult.success) {
          console.error(
            "[Hook] ❌ Failed to update call status:",
            updateResult.error
          );
          setState((prev) => ({
            ...prev,
            isAccepting: false,
            error: updateResult.error || "Failed to accept call",
          }));
          return;
        }
        console.log("[Hook] ✅ Call status updated to accepted");

        // Verify peer connection still exists BEFORE setState
        if (!peerConnectionRef.current) {
          throw new Error("Peer connection lost after initialization");
        }

        // Setup ICE candidate handler BEFORE processing offer (and before setState)
        console.log("[Hook] 🧊 Setting up ICE candidate handler for doctor...");
        peerConnectionRef.current.onIceCandidateHandler(async (candidate) => {
          console.log("[Hook] 🧊 Doctor sending ICE candidate to patient");
          await sendSignalingMessage(
            callId,
            userId,
            userRole,
            patientId,
            "ice-candidate",
            {
              candidate: candidate.candidate,
              sdpMLineIndex: candidate.sdpMLineIndex,
              sdpMid: candidate.sdpMid,
            }
          );
        });

        // Now update state with everything including local stream
        setState((prev) => ({
          ...prev,
          callId,
          callStatus: "accepted",
          isAccepting: false,
          isConnecting: true,
          error: null,
          localStream,
          remoteParticipant: { id: patientId, role: "patient" },
        }));

        console.log(
          "[Hook] ✅ State updated, peer connection still exists:",
          !!peerConnectionRef.current
        );

        // Subscribe to signaling messages
        console.log("[Hook] 📡 Subscribing to signaling messages...");
        unsubscribeSignalingRef.current = subscribeToSignalingMessages(
          callId,
          (message) => handleSignalingMessage(callId, message, patientId),
          (error) => {
            console.error("[Hook] Signaling subscription error:", error);
            setState((prev) => ({ ...prev, error: error.message }));
          }
        );

        // Fetch pending offer from database
        const messages = await getRecentSignalingMessages(callId);
        console.log(
          "[Hook] Retrieved",
          messages.length,
          "signaling messages for call:",
          callId
        );

        // Process any pending offer
        const offerMessage = messages.find((m) => m.signal_type === "offer");
        if (offerMessage) {
          console.log("[Hook] Found pending offer, processing...");
          await handleSignalingMessage(callId, offerMessage, patientId);
        } else {
          console.warn(
            "[Hook] No offer message found! Expected offer from patient."
          );
          console.log(
            "[Hook] Available message types:",
            messages.map((m) => m.signal_type)
          );
        }

        // Also process any pending ICE candidates
        const iceCandidates = messages.filter(
          (m) => m.signal_type === "ice-candidate"
        );
        console.log(
          "[Hook] Found",
          iceCandidates.length,
          "pending ICE candidates"
        );
        for (const iceMessage of iceCandidates) {
          await handleSignalingMessage(callId, iceMessage, patientId);
        }

        startCallDurationTimer();
        console.log("[Hook] Call accepted successfully");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error accepting call";
        console.error("[Hook] Error accepting call:", error);
        setState((prev) => ({
          ...prev,
          isAccepting: false,
          isConnecting: false,
          error: message,
        }));
      }
    },
    [userId, userRole]
  );

  /**
   * Reject call
   */
  const rejectCall = useCallback(
    async (callId: string) => {
      try {
        const result = await updateCallStatus(
          callId,
          "rejected",
          userId,
          userRole
        );
        if (result.success) {
          cleanup();
        }
      } catch (error) {
        console.error("[Hook] Error rejecting call:", error);
      }
    },
    [userId, userRole]
  );

  /**
   * End call
   */
  const endCall = useCallback(async () => {
    try {
      if (state.callId) {
        await endVideoCall(state.callId);
      }
      cleanup();
    } catch (error) {
      console.error("[Hook] Error ending call:", error);
      cleanup();
    }
  }, [state.callId]);

  /**
   * Handle signaling messages (offer, answer, ICE candidates)
   */
  const handleSignalingMessage = useCallback(
    async (callId: string, message: SignalingMessage, remoteUserId: string) => {
      if (!peerConnectionRef.current) {
        console.warn("[Hook] No peer connection available");
        return;
      }

      try {
        if (message.signal_type === "offer") {
          console.log(
            "[Hook] 📥 Processing offer from:",
            message.from_user_role
          );
          if (!remoteDescriptionSettingRef.current) {
            remoteDescriptionSettingRef.current = true;
            try {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(message.signal_data)
              );
              console.log(
                "[Hook] ✅ Remote description (offer) set successfully"
              );

              // Send answer
              console.log("[Hook] 📤 Creating and sending answer...");
              const answer = await peerConnectionRef.current.createAnswer();
              await sendSignalingMessage(
                callId,
                userId,
                userRole,
                remoteUserId,
                "answer",
                {
                  type: answer.type,
                  sdp: answer.sdp,
                }
              );
              console.log("[Hook] ✅ Answer sent successfully");
            } catch (error) {
              console.error("[Hook] ❌ Error processing offer:", error);
              throw error;
            } finally {
              remoteDescriptionSettingRef.current = false;
            }
          } else {
            console.warn(
              "[Hook] ⚠️ Already setting remote description, skipping duplicate offer"
            );
          }
        } else if (message.signal_type === "answer") {
          console.log(
            "[Hook] 📥 Processing answer from:",
            message.from_user_role
          );
          if (!remoteDescriptionSettingRef.current) {
            remoteDescriptionSettingRef.current = true;
            try {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(message.signal_data)
              );
              console.log(
                "[Hook] ✅ Remote description (answer) set successfully"
              );
            } catch (error) {
              console.error("[Hook] ❌ Error processing answer:", error);
              throw error;
            } finally {
              remoteDescriptionSettingRef.current = false;
            }
          } else {
            console.warn(
              "[Hook] ⚠️ Already setting remote description, skipping duplicate answer"
            );
          }
        } else if (message.signal_type === "ice-candidate") {
          console.log(
            "[Hook] 🧊 Processing ICE candidate from:",
            message.from_user_role
          );
          try {
            if (peerConnectionRef.current.getConnectionState() === "closed") {
              console.warn(
                "[Hook] ⚠️ Peer connection closed, skipping ICE candidate"
              );
              return;
            }
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(message.signal_data)
            );
            console.log("[Hook] ✅ ICE candidate added successfully");
          } catch (error) {
            console.warn("[Hook] ⚠️ Failed to add ICE candidate:", error);
            // Don't throw - ICE failures shouldn't break the call
          }
        }
      } catch (error) {
        console.error("[Hook] Error handling signaling message:", error);
      }
    },
    [userId, userRole]
  );

  // ICE candidate handler is now setup directly in initiateCall and acceptCall
  // This ensures it's ready BEFORE any offer/answer exchange

  /**
   * Toggle audio mute
   */
  const toggleAudio = useCallback(() => {
    if (!peerConnectionRef.current) return;

    const isMuted = !state.isAudioMuted;
    peerConnectionRef.current.muteAudio(isMuted);
    setState((prev) => ({ ...prev, isAudioMuted: isMuted }));
  }, [state.isAudioMuted]);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (!peerConnectionRef.current) return;

    const isDisabled = !state.isVideoDisabled;
    peerConnectionRef.current.disableVideo(isDisabled);
    setState((prev) => ({ ...prev, isVideoDisabled: isDisabled }));
  }, [state.isVideoDisabled]);

  /**
   * Start call duration timer
   */
  const startCallDurationTimer = useCallback(() => {
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
    }

    callDurationIntervalRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }));
    }, 1000);
  }, []);

  /**
   * Cleanup
   */
  const cleanup = useCallback(() => {
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
    }

    if (unsubscribeSignalingRef.current) {
      unsubscribeSignalingRef.current();
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    remoteDescriptionSettingRef.current = false;

    setState((prev) => ({
      ...prev,
      callId: null,
      callStatus: null,
      isConnecting: false,
      isConnected: false,
      localStream: null,
      remoteStream: null,
      isAudioMuted: false,
      isVideoDisabled: false,
      callDuration: 0,
      remoteParticipant: null,
    }));
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log("[Hook] 🧹 Component unmounting, cleaning up...");
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }

      if (unsubscribeSignalingRef.current) {
        unsubscribeSignalingRef.current();
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    // State
    ...state,

    // Methods
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
