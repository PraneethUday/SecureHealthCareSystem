"use client";

/**
 * useVideoRoom Hook
 * Manages WebRTC peer connections for room-based video calling
 * with deterministic offer creation and ICE candidate buffering
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  getActiveParticipants,
  updateMediaStatus,
  sendSignal,
  getPendingSignals,
  subscribeToParticipants,
  subscribeToSignals,
  RoomParticipant,
  WebRTCSignal,
  VideoRoom,
} from "@/lib/webrtc/supabase-signaling";

// ==========================================
// TYPES
// ==========================================

export interface UseVideoRoomOptions {
  userId: string;
  userRole: "patient" | "doctor";
  appointmentId: string;
}

export interface VideoRoomState {
  room: VideoRoom | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: RoomParticipant[];
  isJoining: boolean;
  isConnected: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  error: string | null;
}

// ==========================================
// STUN/TURN SERVERS
// ==========================================

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// ==========================================
// HOOK
// ==========================================

export function useVideoRoom({ userId, userRole, appointmentId }: UseVideoRoomOptions) {
  // State
  const [state, setState] = useState<VideoRoomState>({
    room: null,
    localStream: null,
    remoteStreams: new Map(),
    participants: [],
    isJoining: false,
    isConnected: false,
    audioEnabled: true,
    videoEnabled: true,
    error: null,
  });

  // Refs for peer connections and cleanup
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const unsubscribeParticipantsRef = useRef<(() => void) | null>(null);
  const unsubscribeSignalsRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  // ==========================================
  // MEDIA HELPERS
  // ==========================================

  const getLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      console.log("[VideoRoom] 📸 Requesting camera and microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("[VideoRoom] ✅ Got local media stream");
      localStreamRef.current = stream;
      setState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch (error) {
      console.error("[VideoRoom] ❌ Failed to get local media:", error);
      const message = error instanceof Error ? error.message : "Failed to access camera/microphone";
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setState((prev) => ({ ...prev, localStream: null }));
    }
  }, []);

  // ==========================================
  // PEER CONNECTION HELPERS
  // ==========================================

  const createPeerConnection = useCallback(
    (remoteUserId: string, roomId: string): RTCPeerConnection => {
      console.log("[VideoRoom] 🔗 Creating peer connection for:", remoteUserId);

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks to the connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        console.log("[VideoRoom] 📹 Received remote track from:", remoteUserId);
        const [remoteStream] = event.streams;
        setState((prev) => {
          const newStreams = new Map(prev.remoteStreams);
          newStreams.set(remoteUserId, remoteStream);
          return { ...prev, remoteStreams: newStreams, isConnected: true };
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log("[VideoRoom] 🧊 Sending ICE candidate to:", remoteUserId);
          await sendSignal(roomId, userId, remoteUserId, "ice-candidate", event.candidate.toJSON());
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log("[VideoRoom] 🔗 Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setState((prev) => ({ ...prev, isConnected: true }));
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setState((prev) => ({ ...prev, isConnected: false }));
        }
      };

      peerConnectionsRef.current.set(remoteUserId, pc);
      return pc;
    },
    [userId]
  );

  const closePeerConnection = useCallback((remoteUserId: string) => {
    const pc = peerConnectionsRef.current.get(remoteUserId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(remoteUserId);
      setState((prev) => {
        const newStreams = new Map(prev.remoteStreams);
        newStreams.delete(remoteUserId);
        return { ...prev, remoteStreams: newStreams };
      });
    }
  }, []);

  const closeAllPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((pc, id) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    setState((prev) => ({ ...prev, remoteStreams: new Map() }));
  }, []);

  // ==========================================
  // SIGNALING HELPERS
  // ==========================================

  /**
   * Determine who creates the offer (lower user ID creates offer)
   * This prevents "glare" where both sides try to create offers
   */
  const shouldCreateOffer = useCallback(
    (remoteUserId: string): boolean => {
      return userId < remoteUserId;
    },
    [userId]
  );

  const createAndSendOffer = useCallback(
    async (remoteUserId: string, roomId: string) => {
      console.log("[VideoRoom] 📤 Creating offer for:", remoteUserId);
      
      let pc = peerConnectionsRef.current.get(remoteUserId);
      if (!pc) {
        pc = createPeerConnection(remoteUserId, roomId);
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(roomId, userId, remoteUserId, "offer", {
          type: offer.type,
          sdp: offer.sdp,
        });
        console.log("[VideoRoom] ✅ Offer sent to:", remoteUserId);
      } catch (error) {
        console.error("[VideoRoom] ❌ Failed to create offer:", error);
      }
    },
    [userId, createPeerConnection]
  );

  const handleOffer = useCallback(
    async (signal: WebRTCSignal, roomId: string) => {
      console.log("[VideoRoom] 📥 Received offer from:", signal.from_user_id);
      
      let pc = peerConnectionsRef.current.get(signal.from_user_id);
      if (!pc) {
        pc = createPeerConnection(signal.from_user_id, roomId);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data as RTCSessionDescriptionInit));
        
        // Apply any pending ICE candidates
        const pending = pendingCandidatesRef.current.get(signal.from_user_id) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current.delete(signal.from_user_id);

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(roomId, userId, signal.from_user_id, "answer", {
          type: answer.type,
          sdp: answer.sdp,
        });
        console.log("[VideoRoom] ✅ Answer sent to:", signal.from_user_id);
      } catch (error) {
        console.error("[VideoRoom] ❌ Failed to handle offer:", error);
      }
    },
    [userId, createPeerConnection]
  );

  const handleAnswer = useCallback(async (signal: WebRTCSignal) => {
    console.log("[VideoRoom] 📥 Received answer from:", signal.from_user_id);
    
    const pc = peerConnectionsRef.current.get(signal.from_user_id);
    if (!pc) {
      console.warn("[VideoRoom] No peer connection for:", signal.from_user_id);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data as RTCSessionDescriptionInit));
      
      // Apply any pending ICE candidates
      const pending = pendingCandidatesRef.current.get(signal.from_user_id) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(signal.from_user_id);
      console.log("[VideoRoom] ✅ Answer processed from:", signal.from_user_id);
    } catch (error) {
      console.error("[VideoRoom] ❌ Failed to handle answer:", error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (signal: WebRTCSignal) => {
    console.log("[VideoRoom] 🧊 Received ICE candidate from:", signal.from_user_id);
    
    const pc = peerConnectionsRef.current.get(signal.from_user_id);
    const candidate = signal.signal_data as RTCIceCandidateInit;

    if (!pc || !pc.remoteDescription) {
      // Buffer the candidate until remote description is set
      console.log("[VideoRoom] Buffering ICE candidate");
      const pending = pendingCandidatesRef.current.get(signal.from_user_id) || [];
      pending.push(candidate);
      pendingCandidatesRef.current.set(signal.from_user_id, pending);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("[VideoRoom] ✅ ICE candidate added");
    } catch (error) {
      console.error("[VideoRoom] ❌ Failed to add ICE candidate:", error);
    }
  }, []);

  const handleSignal = useCallback(
    async (signal: WebRTCSignal, roomId: string) => {
      switch (signal.signal_type) {
        case "offer":
          await handleOffer(signal, roomId);
          break;
        case "answer":
          await handleAnswer(signal);
          break;
        case "ice-candidate":
          await handleIceCandidate(signal);
          break;
      }
    },
    [handleOffer, handleAnswer, handleIceCandidate]
  );

  // ==========================================
  // ROOM OPERATIONS
  // ==========================================

  /**
   * Create and join a room (typically called by patient)
   */
  const createAndJoinRoom = useCallback(async (): Promise<string | null> => {
    if (isInitializedRef.current) {
      console.log("[VideoRoom] Already initialized");
      return state.room?.id || null;
    }

    try {
      setState((prev) => ({ ...prev, isJoining: true, error: null }));

      // Get local media first
      const stream = await getLocalMedia();
      if (!stream) {
        setState((prev) => ({ ...prev, isJoining: false }));
        return null;
      }

      // Create room
      const roomResult = await createRoom(appointmentId, userId);
      if (!roomResult.success || !roomResult.room) {
        setState((prev) => ({ 
          ...prev, 
          isJoining: false, 
          error: roomResult.error || "Failed to create room" 
        }));
        return null;
      }

      const room = roomResult.room;
      console.log("[VideoRoom] Created room:", room.id);

      // Join room
      const joinResult = await joinRoom(room.id, userId, userRole);
      if (!joinResult.success) {
        setState((prev) => ({ 
          ...prev, 
          isJoining: false, 
          error: joinResult.error || "Failed to join room" 
        }));
        return null;
      }

      // Set up subscriptions
      unsubscribeParticipantsRef.current = subscribeToParticipants(
        room.id,
        async (participant) => {
          // New participant joined
          if (participant.user_id !== userId) {
            console.log("[VideoRoom] New participant:", participant.user_id);
            setState((prev) => ({
              ...prev,
              participants: [...prev.participants.filter(p => p.user_id !== participant.user_id), participant],
            }));

            // Determine who creates the offer
            if (shouldCreateOffer(participant.user_id)) {
              await createAndSendOffer(participant.user_id, room.id);
            }
          }
        },
        (participant) => {
          // Participant left
          console.log("[VideoRoom] Participant left:", participant.user_id);
          closePeerConnection(participant.user_id);
          setState((prev) => ({
            ...prev,
            participants: prev.participants.filter(p => p.user_id !== participant.user_id),
          }));
        }
      );

      unsubscribeSignalsRef.current = subscribeToSignals(
        room.id,
        userId,
        (signal) => handleSignal(signal, room.id)
      );

      setState((prev) => ({ ...prev, room, isJoining: false }));
      isInitializedRef.current = true;

      console.log("[VideoRoom] ✅ Room created and joined successfully");
      return room.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[VideoRoom] ❌ Error creating room:", error);
      setState((prev) => ({ ...prev, isJoining: false, error: message }));
      return null;
    }
  }, [
    appointmentId,
    userId,
    userRole,
    getLocalMedia,
    shouldCreateOffer,
    createAndSendOffer,
    handleSignal,
    closePeerConnection,
    state.room,
  ]);

  /**
   * Join an existing room (typically called by doctor)
   */
  const joinExistingRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (isInitializedRef.current) {
        console.log("[VideoRoom] Already initialized");
        return true;
      }

      try {
        setState((prev) => ({ ...prev, isJoining: true, error: null }));

        // Get room info
        const roomResult = await getRoom(roomId);
        if (!roomResult.success || !roomResult.room) {
          setState((prev) => ({ 
            ...prev, 
            isJoining: false, 
            error: roomResult.error || "Room not found" 
          }));
          return false;
        }

        const room = roomResult.room;

        // Get local media
        const stream = await getLocalMedia();
        if (!stream) {
          setState((prev) => ({ ...prev, isJoining: false }));
          return false;
        }

        // Join room
        const joinResult = await joinRoom(room.id, userId, userRole);
        if (!joinResult.success) {
          setState((prev) => ({ 
            ...prev, 
            isJoining: false, 
            error: joinResult.error || "Failed to join room" 
          }));
          return false;
        }

        // Get existing participants
        const participantsResult = await getActiveParticipants(room.id);
        const existingParticipants = participantsResult.participants || [];
        
        // Get pending signals
        const signalsResult = await getPendingSignals(room.id, userId);
        const pendingSignals = signalsResult.signals || [];

        // Set up subscriptions
        unsubscribeParticipantsRef.current = subscribeToParticipants(
          room.id,
          async (participant) => {
            if (participant.user_id !== userId) {
              console.log("[VideoRoom] New participant:", participant.user_id);
              setState((prev) => ({
                ...prev,
                participants: [...prev.participants.filter(p => p.user_id !== participant.user_id), participant],
              }));

              if (shouldCreateOffer(participant.user_id)) {
                await createAndSendOffer(participant.user_id, room.id);
              }
            }
          },
          (participant) => {
            console.log("[VideoRoom] Participant left:", participant.user_id);
            closePeerConnection(participant.user_id);
            setState((prev) => ({
              ...prev,
              participants: prev.participants.filter(p => p.user_id !== participant.user_id),
            }));
          }
        );

        unsubscribeSignalsRef.current = subscribeToSignals(
          room.id,
          userId,
          (signal) => handleSignal(signal, room.id)
        );

        setState((prev) => ({
          ...prev,
          room,
          participants: existingParticipants.filter(p => p.user_id !== userId),
          isJoining: false,
        }));

        isInitializedRef.current = true;

        // Process pending signals
        for (const signal of pendingSignals) {
          await handleSignal(signal, room.id);
        }

        // Initiate connections with existing participants
        for (const participant of existingParticipants) {
          if (participant.user_id !== userId && shouldCreateOffer(participant.user_id)) {
            await createAndSendOffer(participant.user_id, room.id);
          }
        }

        console.log("[VideoRoom] ✅ Joined room successfully");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[VideoRoom] ❌ Error joining room:", error);
        setState((prev) => ({ ...prev, isJoining: false, error: message }));
        return false;
      }
    },
    [
      userId,
      userRole,
      getLocalMedia,
      shouldCreateOffer,
      createAndSendOffer,
      handleSignal,
      closePeerConnection,
    ]
  );

  /**
   * Leave the current room
   */
  const leave = useCallback(async () => {
    console.log("[VideoRoom] 👋 Leaving room...");

    // Unsubscribe from realtime
    unsubscribeParticipantsRef.current?.();
    unsubscribeSignalsRef.current?.();

    // Close all peer connections
    closeAllPeerConnections();

    // Stop local media
    stopLocalMedia();

    // Update database
    if (state.room) {
      await leaveRoom(state.room.id, userId);
    }

    // Reset state
    setState({
      room: null,
      localStream: null,
      remoteStreams: new Map(),
      participants: [],
      isJoining: false,
      isConnected: false,
      audioEnabled: true,
      videoEnabled: true,
      error: null,
    });

    isInitializedRef.current = false;
    console.log("[VideoRoom] ✅ Left room");
  }, [state.room, userId, closeAllPeerConnections, stopLocalMedia]);

  // ==========================================
  // MEDIA CONTROLS
  // ==========================================

  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const audioEnabled = audioTrack.enabled;
        setState((prev) => ({ ...prev, audioEnabled }));
        
        if (state.room) {
          await updateMediaStatus(state.room.id, userId, audioEnabled, undefined);
        }
        console.log("[VideoRoom] 🎤 Audio:", audioEnabled ? "enabled" : "disabled");
      }
    }
  }, [state.room, userId]);

  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const videoEnabled = videoTrack.enabled;
        setState((prev) => ({ ...prev, videoEnabled }));
        
        if (state.room) {
          await updateMediaStatus(state.room.id, userId, undefined, videoEnabled);
        }
        console.log("[VideoRoom] 📹 Video:", videoEnabled ? "enabled" : "disabled");
      }
    }
  }, [state.room, userId]);

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      console.log("[VideoRoom] 🧹 Cleanup on unmount");
      unsubscribeParticipantsRef.current?.();
      unsubscribeSignalsRef.current?.();
      closeAllPeerConnections();
      stopLocalMedia();
    };
  }, [closeAllPeerConnections, stopLocalMedia]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // State
    room: state.room,
    localStream: state.localStream,
    remoteStreams: state.remoteStreams,
    participants: state.participants,
    isJoining: state.isJoining,
    isConnected: state.isConnected,
    audioEnabled: state.audioEnabled,
    videoEnabled: state.videoEnabled,
    error: state.error,

    // Actions
    createAndJoinRoom,
    joinExistingRoom,
    leave,
    toggleAudio,
    toggleVideo,
  };
}
