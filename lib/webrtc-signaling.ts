import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/realtime-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'renegotiate';
export type CallStatus = 'calling' | 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';

export interface SignalingMessage {
  id: string;
  video_call_id: string;
  from_user_id: string;
  from_user_role: 'patient' | 'doctor';
  to_user_id: string;
  signal_type: SignalType;
  signal_data: any;
  created_at: string;
}

export interface VideoCall {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  status: CallStatus;
  initiated_by_role: 'patient' | 'doctor';
  call_started_at: string | null;
  call_ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new video call and notify the doctor
 * Only patients can initiate calls
 */
export async function createVideoCall(
  appointmentId: string,
  patientId: string,
  doctorId: string,
  userRole: string
): Promise<{ success: boolean; error?: string; videoCallId?: string }> {
  try {
    // Verify patient role
    if (userRole !== 'patient') {
      return { success: false, error: 'Only patients can initiate video calls' };
    }

    // Verify appointment exists and belongs to patient
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, status')
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    if (appointment.patient_id !== patientId) {
      return { success: false, error: 'Unauthorized: this is not your appointment' };
    }

    if (appointment.status !== 'scheduled') {
      return { success: false, error: 'Can only call for scheduled appointments' };
    }

    // Create video call record
    console.log('[WebRTC] Creating video call with:', {
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: appointment.doctor_id,
      status: 'calling',
    });
    
    const { data: videoCall, error: createError } = await supabase
      .from('video_calls')
      .insert({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: appointment.doctor_id,
        status: 'calling',
        initiated_by_role: 'patient',
      })
      .select()
      .single();

    if (createError || !videoCall) {
      console.error('[WebRTC] Error creating video call:', createError);
      return { success: false, error: 'Failed to create video call' };
    }

    // Log the call creation with full details
    console.log(`[WebRTC] ✅ Video call created successfully:`, {
      id: videoCall.id,
      appointment_id: videoCall.appointment_id,
      patient_id: videoCall.patient_id,
      doctor_id: videoCall.doctor_id,
      status: videoCall.status,
    });

    return { success: true, videoCallId: videoCall.id };
  } catch (error) {
    console.error('Error in createVideoCall:', error);
    return { success: false, error: 'Unexpected error creating video call' };
  }
}

/**
 * Update video call status
 */
export async function updateCallStatus(
  videoCallId: string,
  newStatus: CallStatus,
  userId: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get call to verify user is participant
    const { data: videoCall } = await supabase
      .from('video_calls')
      .select('*')
      .eq('id', videoCallId)
      .single();

    if (!videoCall) {
      return { success: false, error: 'Video call not found' };
    }

    // Verify user is participant
    const isPatient = userRole === 'patient' && videoCall.patient_id === userId;
    const isDoctor = userRole === 'doctor' && videoCall.doctor_id === userId;

    if (!isPatient && !isDoctor) {
      return { success: false, error: 'Unauthorized: not a participant in this call' };
    }

    // Update status
    const updates: any = { status: newStatus };

    if (newStatus === 'accepted') {
      updates.call_started_at = new Date().toISOString();
    }

    if (newStatus === 'ended' || newStatus === 'rejected' || newStatus === 'missed') {
      updates.call_ended_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('video_calls')
      .update(updates)
      .eq('id', videoCallId);

    if (updateError) {
      return { success: false, error: 'Failed to update call status' };
    }

    console.log(`[WebRTC] Call status updated: ${videoCallId} -> ${newStatus}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating call status:', error);
    return { success: false, error: 'Unexpected error updating call status' };
  }
}

/**
 * Send signaling message (SDP offer/answer or ICE candidate)
 */
export async function sendSignalingMessage(
  videoCallId: string,
  fromUserId: string,
  fromUserRole: 'patient' | 'doctor',
  toUserId: string,
  signalType: SignalType,
  signalData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('video_call_signaling')
      .insert({
        video_call_id: videoCallId,
        from_user_id: fromUserId,
        from_user_role: fromUserRole,
        to_user_id: toUserId,
        signal_type: signalType,
        signal_data: signalData,
      });

    if (error) {
      console.error('Error sending signaling message:', error);
      return { success: false, error: 'Failed to send signaling message' };
    }

    console.log(`[WebRTC] Signaling message sent: ${signalType}`);
    return { success: true };
  } catch (error) {
    console.error('Error in sendSignalingMessage:', error);
    return { success: false, error: 'Unexpected error sending signaling message' };
  }
}

/**
 * Get recent signaling messages for a video call
 */
export async function getRecentSignalingMessages(
  videoCallId: string,
  afterTimestamp?: string
): Promise<SignalingMessage[]> {
  try {
    let query = supabase
      .from('video_call_signaling')
      .select('*')
      .eq('video_call_id', videoCallId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (afterTimestamp) {
      query = query.gt('created_at', afterTimestamp);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching signaling messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentSignalingMessages:', error);
    return [];
  }
}

/**
 * Subscribe to incoming signaling messages for a video call
 * Returns unsubscribe function
 */
export function subscribeToSignalingMessages(
  videoCallId: string,
  onMessage: (message: SignalingMessage) => void,
  onError?: (error: any) => void
): () => void {
  const channel = supabase
    .channel(`video_call:${videoCallId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'video_call_signaling',
        filter: `video_call_id=eq.${videoCallId}`,
      },
      (payload: any) => {
        console.log(`[WebRTC] Signaling message received: ${payload.new.signal_type}`);
        onMessage(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[WebRTC] Channel subscription error: ${status}`);
        onError?.(new Error(`Channel error: ${status}`));
      }
    });

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to incoming call notifications for a doctor
 * Returns unsubscribe function
 */
export function subscribeToIncomingCalls(
  doctorId: string,
  onIncomingCall: (call: VideoCall) => void,
  onError?: (error: any) => void
): () => void {
  console.log(`[WebRTC] Subscribing to incoming calls for doctor: ${doctorId}`);
  
  if (!doctorId) {
    console.error('[WebRTC] Cannot subscribe - doctorId is empty!');
    return () => {};
  }
  
  const channel = supabase
    .channel(`incoming_calls:${doctorId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'video_calls',
        filter: `doctor_id=eq.${doctorId}`,
      },
      (payload: any) => {
        console.log(`[WebRTC] INSERT event received for video_calls table:`, payload);
        if (payload.new && payload.new.status === 'calling') {
          console.log(`[WebRTC] 🔔 Incoming call received: ${payload.new.id}`);
          onIncomingCall(payload.new);
        } else {
          console.log(`[WebRTC] INSERT event but not a calling status:`, payload.new?.status);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'video_calls',
        filter: `doctor_id=eq.${doctorId}`,
      },
      (payload: any) => {
        console.log(`[WebRTC] Call status changed: ${payload.new?.status}`);
        // Caller will check for status changes via subscription
      }
    )
    .subscribe((status) => {
      console.log(`[WebRTC] Subscription status for doctor ${doctorId}: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log(`[WebRTC] ✅ Successfully subscribed to incoming calls for doctor: ${doctorId}`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[WebRTC] ❌ Channel subscription error: ${status}`);
        onError?.(new Error(`Channel error: ${status}`));
      }
    });

  return () => {
    console.log(`[WebRTC] Unsubscribing from incoming calls for doctor: ${doctorId}`);
    supabase.removeChannel(channel);
  };
}

/**
 * Get video call by ID
 */
export async function getVideoCall(videoCallId: string): Promise<VideoCall | null> {
  try {
    const { data, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('id', videoCallId)
      .single();

    if (error) {
      console.error('Error fetching video call:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getVideoCall:', error);
    return null;
  }
}

/**
 * End a video call and cleanup
 */
export async function endVideoCall(videoCallId: string): Promise<{ success: boolean }> {
  try {
    // Update call status
    const { error: updateError } = await supabase
      .from('video_calls')
      .update({
        status: 'ended',
        call_ended_at: new Date().toISOString(),
      })
      .eq('id', videoCallId);

    if (updateError) {
      console.error('Error ending video call:', updateError);
      return { success: false };
    }

    // Clean up signaling data
    const { error: deleteError } = await supabase
      .from('video_call_signaling')
      .delete()
      .eq('video_call_id', videoCallId);

    if (deleteError) {
      console.warn('Warning: Failed to cleanup signaling data:', deleteError);
    }

    console.log(`[WebRTC] Call ended and cleaned up: ${videoCallId}`);
    return { success: true };
  } catch (error) {
    console.error('Error in endVideoCall:', error);
    return { success: false };
  }
}
