/**
 * Supabase Signaling for WebRTC Video Rooms
 * Handles database operations for rooms, participants, and signaling
 */

import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

// ==========================================
// TYPES
// ==========================================

export interface VideoRoom {
  id: string;
  name: string;
  appointment_id: string;
  created_by: string;
  created_at: string;
  ended_at: string | null;
  is_active: boolean;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  user_role: "patient" | "doctor";
  audio_enabled: boolean;
  video_enabled: boolean;
  joined_at: string;
  left_at: string | null;
}

export interface WebRTCSignal {
  id: string;
  room_id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: "offer" | "answer" | "ice-candidate";
  signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

// ==========================================
// ROOM OPERATIONS
// ==========================================

/**
 * Create a new video room for an appointment
 */
export async function createRoom(
  appointmentId: string,
  createdBy: string,
  name?: string
): Promise<{ success: boolean; room?: VideoRoom; error?: string }> {
  try {
    // Check if there's already an active room for this appointment
    const { data: existingRoom } = await supabase
      .from("video_rooms")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("is_active", true)
      .single();

    if (existingRoom) {
      console.log("[Signaling] Reusing existing room:", existingRoom.id);
      return { success: true, room: existingRoom };
    }

    // Create new room
    const { data, error } = await supabase
      .from("video_rooms")
      .insert({
        appointment_id: appointmentId,
        created_by: createdBy,
        name: name || `Call for appointment ${appointmentId}`,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[Signaling] Error creating room:", error);
      return { success: false, error: error.message };
    }

    console.log("[Signaling] Room created:", data.id);
    return { success: true, room: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Signaling] Error creating room:", error);
    return { success: false, error: message };
  }
}

/**
 * Get a room by ID
 */
export async function getRoom(
  roomId: string
): Promise<{ success: boolean; room?: VideoRoom; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("video_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, room: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Get active room for an appointment
 */
export async function getActiveRoomForAppointment(
  appointmentId: string
): Promise<{ success: boolean; room?: VideoRoom; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("video_rooms")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return { success: false, error: error.message };
    }

    return { success: true, room: data || undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * End a room
 */
export async function endRoom(
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("video_rooms")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log("[Signaling] Room ended:", roomId);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ==========================================
// PARTICIPANT OPERATIONS
// ==========================================

/**
 * Join a room as a participant
 */
export async function joinRoom(
  roomId: string,
  userId: string,
  userRole: "patient" | "doctor"
): Promise<{ success: boolean; participant?: RoomParticipant; error?: string }> {
  try {
    // Use upsert to handle rejoining
    const { data, error } = await supabase
      .from("room_participants")
      .upsert(
        {
          room_id: roomId,
          user_id: userId,
          user_role: userRole,
          audio_enabled: true,
          video_enabled: true,
          joined_at: new Date().toISOString(),
          left_at: null,
        },
        {
          onConflict: "room_id,user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Signaling] Error joining room:", error);
      return { success: false, error: error.message };
    }

    console.log("[Signaling] Joined room:", roomId, "as", userRole);
    return { success: true, participant: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Signaling] Error joining room:", error);
    return { success: false, error: message };
  }
}

/**
 * Leave a room
 */
export async function leaveRoom(
  roomId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("room_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log("[Signaling] Left room:", roomId);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Get active participants in a room
 */
export async function getActiveParticipants(
  roomId: string
): Promise<{ success: boolean; participants?: RoomParticipant[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId)
      .is("left_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, participants: data || [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Update participant media status
 */
export async function updateMediaStatus(
  roomId: string,
  userId: string,
  audioEnabled?: boolean,
  videoEnabled?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: Partial<RoomParticipant> = {};
    if (audioEnabled !== undefined) updates.audio_enabled = audioEnabled;
    if (videoEnabled !== undefined) updates.video_enabled = videoEnabled;

    const { error } = await supabase
      .from("room_participants")
      .update(updates)
      .eq("room_id", roomId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ==========================================
// SIGNALING OPERATIONS
// ==========================================

/**
 * Send a signaling message
 */
export async function sendSignal(
  roomId: string,
  fromUserId: string,
  toUserId: string,
  signalType: "offer" | "answer" | "ice-candidate",
  signalData: RTCSessionDescriptionInit | RTCIceCandidateInit
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("webrtc_signals").insert({
      room_id: roomId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      signal_type: signalType,
      signal_data: signalData,
    });

    if (error) {
      console.error("[Signaling] Error sending signal:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Signaling] Sent ${signalType} to ${toUserId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Signaling] Error sending signal:", error);
    return { success: false, error: message };
  }
}

/**
 * Get pending signals for a user in a room
 */
export async function getPendingSignals(
  roomId: string,
  userId: string
): Promise<{ success: boolean; signals?: WebRTCSignal[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("webrtc_signals")
      .select("*")
      .eq("room_id", roomId)
      .eq("to_user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, signals: data || [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Delete processed signals
 */
export async function deleteSignals(
  signalIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (signalIds.length === 0) return { success: true };

    const { error } = await supabase
      .from("webrtc_signals")
      .delete()
      .in("id", signalIds);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ==========================================
// REALTIME SUBSCRIPTIONS
// ==========================================

/**
 * Subscribe to participant changes in a room
 */
export function subscribeToParticipants(
  roomId: string,
  onParticipantJoined: (participant: RoomParticipant) => void,
  onParticipantLeft: (participant: RoomParticipant) => void,
  onError?: (error: Error) => void
): () => void {
  const channel = supabase
    .channel(`room-participants-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_participants",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log("[Signaling] Participant joined:", payload.new);
        onParticipantJoined(payload.new as RoomParticipant);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "room_participants",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const participant = payload.new as RoomParticipant;
        if (participant.left_at) {
          console.log("[Signaling] Participant left:", participant);
          onParticipantLeft(participant);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Signaling] Subscribed to participants in room:", roomId);
      } else if (status === "CHANNEL_ERROR") {
        onError?.(new Error("Failed to subscribe to participants"));
      }
    });

  return () => {
    console.log("[Signaling] Unsubscribing from participants");
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to signaling messages for a user
 */
export function subscribeToSignals(
  roomId: string,
  userId: string,
  onSignal: (signal: WebRTCSignal) => void,
  onError?: (error: Error) => void
): () => void {
  const channel = supabase
    .channel(`signals-${roomId}-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "webrtc_signals",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const signal = payload.new as WebRTCSignal;
        // Only process signals meant for this user
        if (signal.to_user_id === userId) {
          console.log(`[Signaling] Received ${signal.signal_type} from ${signal.from_user_id}`);
          onSignal(signal);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Signaling] Subscribed to signals for user:", userId);
      } else if (status === "CHANNEL_ERROR") {
        onError?.(new Error("Failed to subscribe to signals"));
      }
    });

  return () => {
    console.log("[Signaling] Unsubscribing from signals");
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to room for incoming calls (for doctor dashboard)
 */
export function subscribeToIncomingRooms(
  appointmentIds: string[],
  onNewRoom: (room: VideoRoom) => void,
  onError?: (error: Error) => void
): () => void {
  if (appointmentIds.length === 0) {
    return () => {};
  }

  const channel = supabase
    .channel("incoming-rooms")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "video_rooms",
      },
      (payload) => {
        const room = payload.new as VideoRoom;
        if (appointmentIds.includes(room.appointment_id)) {
          console.log("[Signaling] New room for appointment:", room.appointment_id);
          onNewRoom(room);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Signaling] Subscribed to incoming rooms");
      } else if (status === "CHANNEL_ERROR") {
        onError?.(new Error("Failed to subscribe to incoming rooms"));
      }
    });

  return () => {
    console.log("[Signaling] Unsubscribing from incoming rooms");
    supabase.removeChannel(channel);
  };
}
