# WebRTC Video Call System Implementation Guide

## Overview

This document describes the complete WebRTC video call system implementation for the Secure Healthcare System, enabling secure 1-to-1 patient-doctor video consultations with role-based access control and appointment validation.

## Architecture

### Components

1. **Database Layer** (`supabase/webrtc-schema.sql`)
   - `video_calls`: Main call state tracking table
   - `video_call_signaling`: Ephemeral signaling message storage
   - RLS policies for secure access
   - Automatic cleanup triggers

2. **Signaling Layer** (`lib/webrtc-signaling.ts`)
   - Supabase Realtime-based signaling
   - SDP offer/answer exchange
   - ICE candidate management
   - Call state management

3. **Peer Connection Manager** (`lib/webrtc-peer-connection.ts`)
   - RTCPeerConnection lifecycle management
   - Media device handling (getUserMedia)
   - Audio/video track management
   - Connection state monitoring

4. **React Hook** (`hooks/useWebRTC.ts`)
   - State management for call lifecycle
   - Media stream handling
   - Signaling message processing
   - Error handling and cleanup

5. **UI Components**
   - **IncomingCallModal** (`app/dashboard/doctor/components/IncomingCallModal.tsx`): Doctor receives call notifications
   - **CallPage** (`app/dashboard/components/CallPage.tsx`): Dual-video call interface with controls
   - **AppointmentCard Updates** (`app/dashboard/patient/components/AppointmentCard.tsx`): Start call button for patients

6. **API Routes**
   - `app/api/video-calls/initiate/route.ts`: Patient initiates call
   - `app/api/appointments/[appointmentId]/details/route.ts`: Fetch appointment details

## Database Schema

### video_calls Table

```sql
id (UUID PK)                    -- Unique call identifier
appointment_id (UUID FK)        -- Links to existing appointment
patient_id (UUID FK)            -- Patient participant
doctor_id (UUID FK)             -- Doctor participant
status (ENUM)                   -- calling|ringing|accepted|rejected|ended|missed
initiated_by_role (VARCHAR)     -- Who initiated (patient|doctor)
call_started_at (TIMESTAMP)     -- When call was accepted
call_ended_at (TIMESTAMP)       -- When call ended
duration_seconds (INTEGER)      -- Auto-calculated duration
quality_metrics (JSONB)         -- Call quality stats
error_logs (JSONB)              -- Error tracking
created_at (TIMESTAMP)          -- Call creation time
updated_at (TIMESTAMP)          -- Last update time
```

### video_call_signaling Table

```sql
id (UUID PK)                    -- Unique message identifier
video_call_id (UUID FK)         -- Parent call
from_user_id (UUID)             -- Message originator
from_user_role (VARCHAR)        -- Originator role
to_user_id (UUID)               -- Message recipient
signal_type (VARCHAR)           -- offer|answer|ice-candidate|renegotiate
signal_data (JSONB)             -- SDP or ICE candidate data
created_at (TIMESTAMP)          -- Message creation time
```

## Call Flow

### Initiating a Call (Patient → Doctor)

```
1. Patient clicks "Start Video Call" on appointment card
   ↓
2. AppointmentCard validates:
   - Appointment status is 'scheduled'
   - Appointment time hasn't passed
   ↓
3. Calls POST /api/video-calls/initiate
   ↓
4. API validates:
   - User is authenticated patient
   - Appointment belongs to patient
   - Doctor ID matches appointment
   ↓
5. Creates video_calls record with status='calling'
   ↓
6. Patient's useWebRTC hook:
   - Initializes local media (camera/mic)
   - Subscribes to signaling messages
   - Creates SDP offer
   - Sends offer to doctor via signaling table
   ↓
7. Doctor receives notification via Realtime subscription
   - IncomingCallModal shows
   ↓
8. Doctor accepts call
   - Updates video_calls status to 'accepted'
   - Initializes local media
   - Creates SDP answer
   - Sends answer to patient
   ↓
9. Both parties:
   - Exchange ICE candidates
   - Establish P2P connection
   - Receive remote media stream
   - status → 'accepted'
   ↓
10. Call Page displays dual video feeds
    - Local preview (bottom right, mirrored)
    - Remote video (full screen)
    - Call controls (mute, camera, end)
```

### Rejecting a Call (Doctor)

```
1. Doctor clicks "Reject" in incoming call modal
   ↓
2. Updates video_calls status to 'rejected'
   ↓
3. Patient's Realtime subscription detects status change
   ↓
4. useWebRTC hook cleans up and closes connection
```

### Ending a Call

```
1. Either party clicks "End Call"
   ↓
2. Updates video_calls status to 'ended'
   ↓
3. Both useWebRTC hooks detect status change
   ↓
4. Cleanup:
   - Stop local media tracks
   - Close RTCPeerConnection
   - Unsubscribe from signaling
   - Clear call state
   ↓
5. Navigate back to dashboard
```

## Security Features

### Role-Based Access Control

- **RLS Policies**: Database policies ensure:
  - Patients can only view/create their own calls
  - Doctors can only view/update their own calls
  - Signaling data accessible only to call participants

- **Appointment Validation**: Calls can only be initiated for:
  - Valid appointments in the system
  - Appointments belonging to the caller (patient)
  - Scheduled appointments (not cancelled/completed)
  - Appointments with correct doctor ID

- **Authentication**: All API calls verified with:
  - JWT token authentication
  - Role verification from profiles table
  - User ID validation

### Privacy

- **Ephemeral Signaling**: Signaling messages auto-deleted after 24 hours
- **No Recording by Default**: System doesn't record calls
- **Encrypted Transport**: All data sent over HTTPS/WSS
- **Media Encryption**: WebRTC uses DTLS-SRTP for media encryption

## Implementation Details

### WebRTC Configuration

**STUN Servers** (for NAT traversal):
```typescript
- stun:stun.l.google.com:19302
- stun:stun1.l.google.com:19302
- stun:stun2.l.google.com:19302
```

**TURN Server** (optional):
```
Configure via environment variables:
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_PASSWORD=password
```

### Media Constraints

**Audio**:
```javascript
{
  echoCancellation: true,
  noiseSuppression: true
}
```

**Video**:
```javascript
{
  width: { ideal: 1280 },
  height: { ideal: 720 }
}
```

### Connection State Transitions

```
Initial
  ↓
getLocalStream() → local media acquired
  ↓
createOffer() → patient side
  ↓
sendOffer() → via signaling table
  ↓
receiveAnswer() → from doctor
  ↓
setRemoteDescription(answer)
  ↓
exchangeICECandidates()
  ↓
connectionState = 'connected'
  ↓
remoteStream ready
```

## Error Handling

### Common Issues

1. **Media Access Denied**
   - User didn't grant camera/mic permissions
   - Browser dialog timed out
   - Devices not available
   - **Solution**: Prompt user to check permissions

2. **ICE Connection Failed**
   - No STUN/TURN server reachable
   - Firewall blocking P2P
   - **Solution**: Configure TURN server for relay fallback

3. **Signaling Timeout**
   - Other party didn't respond
   - Network interrupted
   - **Solution**: Auto-reject after 30 seconds, show timeout message

4. **Permission Errors**
   - Patient initiating call for wrong doctor
   - Doctor accepting call not their own
   - **Solution**: API validation before database changes

## Usage

### Patient Starting a Call

1. Navigate to "Appointments" in patient dashboard
2. Find scheduled appointment
3. Click "Start Video Call" button
4. Grant camera/microphone access
5. Wait for doctor to accept
6. Video call starts when doctor accepts

### Doctor Receiving a Call

1. Incoming call modal appears with patient name
2. Shows appointment details and call time
3. Click "Accept" to join call or "Reject" to decline
4. If accepted, call page opens with video feeds
5. Use controls to mute/toggle camera/end call

### Call Controls

- **Mute Button**: Toggle microphone on/off
- **Camera Button**: Toggle video camera on/off
- **End Call Button**: Terminate call and cleanup
- **Connection Status**: Shows connection quality and duration

## Development

### Dependencies

- `@supabase/supabase-js`: Database and Realtime
- `next`: React framework
- `react`: UI library
- `typescript`: Type safety

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional TURN server
NEXT_PUBLIC_TURN_SERVER=turn:your-server.com
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_PASSWORD=password
```

### Deployment

1. **Deploy Database Schema**:
   ```sql
   -- Run supabase/webrtc-schema.sql in Supabase dashboard
   ```

2. **Deploy Application**:
   ```bash
   npm run build
   npm start
   ```

3. **Verify Realtime**:
   - Enable Realtime in Supabase project settings
   - Verify `video_calls` and `video_call_signaling` tables are in replication list

## Testing

### Manual Testing Checklist

- [ ] Patient can start video call for scheduled appointment
- [ ] Doctor receives incoming call notification
- [ ] Doctor can accept call
- [ ] Both parties see each other's video feed
- [ ] Mute button works
- [ ] Camera toggle works
- [ ] Either party can end call
- [ ] Call duration updates correctly
- [ ] Doctor can reject incoming call
- [ ] Can't start call for completed/cancelled appointment
- [ ] Can't call wrong doctor
- [ ] Can't initiate call as doctor
- [ ] Rejected/missed calls handled gracefully

### Performance Monitoring

Monitor via Supabase dashboard:
- Query performance for signaling messages
- Realtime subscription counts
- Database trigger execution times
- RLS policy evaluation overhead

## Troubleshooting

### No Video Feed Appears

1. Check browser console for getUserMedia errors
2. Verify camera/mic permissions granted
3. Check STUN server connectivity
4. Verify firewall allows WebRTC traffic

### Audio Not Working

1. Verify microphone selected correctly
2. Check echo cancellation settings
3. Test microphone in browser settings
4. Check browser audio output volume

### Connection Drops

1. Check network stability
2. Verify TURN server configured (if behind NAT)
3. Check browser console for error messages
4. Monitor Supabase Realtime connection

### Signaling Messages Not Received

1. Verify Realtime enabled in Supabase
2. Check RLS policies allow access
3. Verify subscription to correct table filter
4. Check for PostgreSQL policy evaluation errors

## Future Enhancements

1. **Screen Sharing**: Add RTCDataChannel for screen capture
2. **Call Recording**: Store media streams with user consent
3. **Quality Metrics**: Display bandwidth/latency metrics
4. **Call History**: Persist call logs and metrics
5. **Chat**: Add text-based chat during call
6. **Group Calls**: Support multiple doctors (specialist consultations)
7. **Prescriptions**: Generate prescriptions within call interface
8. **Appointment Notes**: Auto-save call notes as appointment outcome

## References

- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [STUN/TURN Protocols](https://www.ietf.org/rfc/rfc5389.txt)
- [WebRTC Security](https://www.ietf.org/rfc/rfc8827.txt)
