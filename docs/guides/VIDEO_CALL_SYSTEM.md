# Video Call System Documentation

## Overview

The Secure Healthcare System includes a complete WebRTC-powered video calling system that enables real-time video consultations between patients and doctors. The system uses peer-to-peer connections with STUN servers for NAT traversal and Supabase Realtime for signaling.

## Architecture

### Technology Stack

- **WebRTC**: Peer-to-peer video/audio streaming
- **Supabase Realtime**: Signaling channel for SDP offer/answer and ICE candidate exchange
- **STUN Servers**: Google STUN servers for NAT traversal
- **React Hooks**: Custom `useWebRTC` hook for state management

### Components

#### 1. **useWebRTC Hook** (`hooks/useWebRTC.ts`)
Central hook managing the entire video call lifecycle:
- Media device access (camera/microphone)
- WebRTC peer connection management
- Signaling message handling
- Connection state management
- Audio/video controls

#### 2. **PeerConnection Class** (`lib/webrtc-peer-connection.ts`)
Low-level WebRTC wrapper:
- RTCPeerConnection lifecycle management
- Local/remote stream handling
- SDP offer/answer creation
- ICE candidate processing
- Media device enumeration and access

#### 3. **Signaling Service** (`lib/webrtc-signaling.ts`)
Handles communication via Supabase:
- Creates video call records
- Sends/receives signaling messages (offer/answer/ICE)
- Subscribes to real-time updates
- Manages call status updates

#### 4. **UI Components**
- **Patient Call Start Page** (`app/dashboard/call/start/page.tsx`): Initiates calls with camera permissions
- **Doctor Call Page** (`app/dashboard/components/CallPage.tsx`): Accepts and manages incoming calls
- **Incoming Call Modal** (`app/dashboard/doctor/components/IncomingCallModal.tsx`): Real-time notification system

## Database Schema

### Tables

#### `video_calls`
Stores call metadata and status.

```sql
CREATE TABLE video_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  status TEXT CHECK (status IN ('calling', 'accepted', 'in-progress', 'ended', 'rejected')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `video_call_signaling`
Stores WebRTC signaling messages (SDP offers/answers and ICE candidates).

```sql
CREATE TABLE video_call_signaling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES video_calls(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  from_user_role TEXT NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Important**: Both tables must have Supabase Realtime enabled for the notification system to work.

## Call Flow

### Patient Initiates Call

```
1. Patient clicks "Start Video Call" on appointment card
   ↓
2. Navigate to /dashboard/call/start?appointmentId=X&doctorId=Y
   ↓
3. Browser requests camera/microphone permissions
   ↓
4. useWebRTC.initiateCall(doctorId) called
   ↓
5. PeerConnection.getLocalStream() → getUserMedia
   ↓
6. Create video_call record in database (status: 'calling')
   ↓
7. Setup ICE candidate handler (sends candidates as they're generated)
   ↓
8. Subscribe to signaling messages from doctor
   ↓
9. Create SDP offer via PeerConnection.createOffer()
   ↓
10. Send offer to database (video_call_signaling table)
    ↓
11. Display call interface with local video
    ↓
12. Wait for doctor to accept (listen for answer via Realtime)
```

### Doctor Receives and Accepts Call

```
1. Doctor dashboard subscribed to video_calls table (Realtime)
   ↓
2. New call record appears → IncomingCallModal displayed
   ↓
3. Doctor clicks "Accept"
   ↓
4. Navigate to /dashboard/call/[callId]
   ↓
5. Browser requests camera/microphone permissions
   ↓
6. useWebRTC.acceptCall(callId, patientId) called
   ↓
7. PeerConnection.getLocalStream() → getUserMedia
   ↓
8. Update call status to 'accepted'
   ↓
9. Setup ICE candidate handler
   ↓
10. Subscribe to signaling messages from patient
    ↓
11. Fetch recent signaling messages (get patient's offer)
    ↓
12. Set remote description (patient's offer)
    ↓
13. Create SDP answer via PeerConnection.createAnswer()
    ↓
14. Send answer to database
    ↓
15. Process any pending ICE candidates from patient
    ↓
16. Display call interface with local and remote video
```

### Connection Establishment

```
Patient                          Supabase DB                       Doctor
   |                                  |                              |
   |--Create SDP Offer-------------→ |                              |
   |--ICE Candidate 1---------------→ |                              |
   |--ICE Candidate 2---------------→ |                              |
   |                                  |--Realtime Notification----→ |
   |                                  | ←-Fetch Offer-----------------
   |                                  | ←-Fetch ICE Candidates--------
   |                                  | ←-Send SDP Answer-------------
   |                                  | ←-ICE Candidate 1-------------
   | ←-Realtime SDP Answer----------- |                              |
   | ←-Realtime ICE Candidate 1------ |                              |
   |                                  |                              |
   |==================== P2P Connection Established ==================|
   |                                                                  |
   | ←--------------------- Video/Audio Streams --------------------→ |
```

## Key Features

### 1. Camera & Microphone Access

The system properly requests permissions and handles various scenarios:

```typescript
// Detects available devices
const devices = await navigator.mediaDevices.enumerateDevices();

// Requests appropriate permissions
const constraints = {
  audio: { echoCancellation: true, noiseSuppression: true },
  video: { width: { ideal: 1280 }, height: { ideal: 720 } }
};

const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

**Error Handling**:
- Permission denied: Clear message to user
- No devices found: Prompts to connect camera/mic
- Device already in use: Attempts to reuse existing stream

### 2. Signaling via Supabase

Instead of WebSockets, uses Supabase Realtime:

```typescript
// Subscribe to incoming messages
const subscription = supabase
  .channel(`call:${callId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'video_call_signaling',
    filter: `call_id=eq.${callId}`
  }, (payload) => {
    handleSignalingMessage(payload.new);
  })
  .subscribe();
```

### 3. ICE Candidate Handling

Critical timing fix - ICE handlers are set up BEFORE creating offers/answers:

```typescript
// Patient side - BEFORE creating offer
peerConnection.onIceCandidateHandler(async (candidate) => {
  await sendSignalingMessage(callId, userId, userRole, doctorId, 'ice-candidate', {
    candidate: candidate.candidate,
    sdpMLineIndex: candidate.sdpMLineIndex,
    sdpMid: candidate.sdpMid,
  });
});

const offer = await peerConnection.createOffer(); // ICE candidates generated immediately
```

### 4. Connection State Monitoring

```typescript
peerConnection.onConnectionStateChange((state) => {
  // States: new, connecting, connected, disconnected, failed, closed
  if (state === 'connected') {
    // Peer-to-peer connection established
    setState({ isConnected: true, callStatus: 'in-progress' });
  }
});
```

### 5. Media Controls

- **Mute/Unmute Audio**: Disables audio track without removing it
- **Enable/Disable Video**: Stops video track
- **End Call**: Closes peer connection and updates database

## Setup Requirements

### 1. Enable Supabase Realtime

**Critical**: Realtime must be enabled for call notifications to work.

#### Via Supabase Dashboard:
1. Go to Database → Replication
2. Enable Realtime for these tables:
   - `video_calls`
   - `video_call_signaling`

#### Via SQL:
```sql
-- Enable Realtime for video calls
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;
```

### 2. Environment Variables

No additional environment variables required for basic functionality.

**Optional** - For TURN server support (bypassing restrictive firewalls):
```env
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_PASSWORD=password
```

### 3. Database Schema

Run the WebRTC schema migration:
```bash
npm run setup:webrtc
```

Or manually execute:
```sql
-- See supabase/webrtc-schema.sql
```

## Testing the System

### Prerequisites
- Two separate browsers or devices
- Camera and microphone on both
- Patient and doctor accounts

### Test Steps

1. **Login as Patient**
   - Navigate to dashboard
   - Find an appointment with a doctor
   - Click "Start Video Call"
   - **Expect**: Browser asks for camera/microphone permissions
   - **Expect**: After granting, see your own video

2. **Login as Doctor** (different browser/device)
   - Navigate to dashboard
   - **Expect**: Modal pops up showing incoming call
   - Click "Accept"
   - **Expect**: Browser asks for camera/microphone permissions
   - **Expect**: After granting, see both videos (yours and patient's)

3. **Verify Connection**
   - **Patient side**: Status changes from "Calling..." to "Connected"
   - **Doctor side**: Status shows "Connected" with call duration timer
   - **Both sides**: Can see and hear each other

4. **Test Controls**
   - Click mute button → Other party shouldn't hear audio
   - Click video disable → Other party shouldn't see video
   - Click end call → Both disconnected, redirected to dashboard

## Troubleshooting

### Issue: "Doctor doesn't receive notifications"

**Cause**: Supabase Realtime not enabled

**Solution**: 
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;
```

### Issue: "Stuck on 'Connecting...' forever"

**Cause**: ICE candidates not being exchanged

**Symptoms**:
- Local video works on both sides
- Status stays "Connecting..." or "Calling..."
- Never reaches "Connected"

**Debug**:
1. Check browser console for "🧊 Processing ICE candidate" messages
2. Verify ICE handlers are set up before offer/answer creation
3. Check Supabase Realtime subscription is active

**Solution**: Ensure latest code with ICE handler timing fix

### Issue: "Permission denied" or no camera access

**Cause**: Browser permissions blocked

**Solution**:
1. Click lock icon in browser address bar
2. Allow camera and microphone
3. Refresh page and try again

### Issue: "No video showing" on patient side

**Debug**:
1. Check console for "✅ Camera and microphone access granted!"
2. Verify stream tracks: `video: 1, audio: 1`
3. Check "✅ Local stream attached to video element"

**Common Causes**:
- Stream not attached to video element
- `autoPlay` blocked by browser
- Video element missing `playsInline` attribute

### Issue: "Remote video not showing"

**Debug**:
1. Check console for "📹 Remote stream received"
2. Verify connection state reaches "connected"
3. Check ICE candidates are being processed

**Common Causes**:
- Connection not established (stuck in connecting state)
- Missing ICE candidates
- STUN server connectivity issues

## Performance Considerations

### Video Quality

Default constraints:
```typescript
video: { 
  width: { ideal: 1280 }, 
  height: { ideal: 720 } 
}
```

For lower bandwidth:
```typescript
video: { 
  width: { ideal: 640 }, 
  height: { ideal: 480 } 
}
```

### Audio Quality

Default settings provide optimal quality:
```typescript
audio: { 
  echoCancellation: true, 
  noiseSuppression: true 
}
```

## Security Considerations

1. **Database RLS Policies**: Ensure proper Row Level Security
2. **User Authentication**: Verify user roles before allowing calls
3. **Appointment Validation**: Only allow calls for valid appointments
4. **HTTPS Required**: WebRTC requires secure context (HTTPS in production)

## Future Enhancements

Potential improvements:
- [ ] Call recording functionality
- [ ] Screen sharing capability
- [ ] Group video calls (multiple doctors)
- [ ] Call quality indicators
- [ ] Network quality adaptation
- [ ] Chat messaging during calls
- [ ] File sharing during consultation
- [ ] Post-call survey/feedback

## Code Examples

### Starting a Call (Patient)

```typescript
const { initiateCall, localStream, remoteStream, isConnected } = useWebRTC({
  userId: patient.id,
  userRole: 'patient',
  appointmentId: appointment.id
});

// Initiate the call
await initiateCall(doctorId);

// Attach streams to video elements
<video ref={localVideoRef} autoPlay playsInline muted />
<video ref={remoteVideoRef} autoPlay playsInline />
```

### Accepting a Call (Doctor)

```typescript
const { acceptCall, localStream, remoteStream, isConnected } = useWebRTC({
  userId: doctor.id,
  userRole: 'doctor'
});

// Accept incoming call
await acceptCall(callId, patientId);

// Video elements same as above
```

### Ending a Call

```typescript
const { endCall } = useWebRTC({ userId, userRole });

await endCall(); // Closes connection and updates database
```

## Related Documentation

- [WebRTC Official Documentation](https://webrtc.org/)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify Supabase Realtime is enabled
3. Ensure both parties have camera/microphone permissions
4. Test with different browsers/devices
