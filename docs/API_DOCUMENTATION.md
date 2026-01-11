# API Documentation

## Overview

The Secure Healthcare System uses Next.js API routes for backend functionality. All APIs require proper authentication and role-based access control.

## Authentication

### Session Management

Sessions are managed via HTTP-only cookies stored after successful login.

```typescript
// lib/auth.ts

// Get current session
export function getSession(): Session | null {
  const cookies = document.cookie.split(';');
  // Returns { user: { id, email, role }, role }
}

// Check session (server-side)
export async function checkSession(req: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: User;
  role?: string;
}>
```

### User Roles

- `patient`: Regular patients
- `doctor`: Medical doctors
- `nurse`: Nursing staff
- `admin`: Administrative staff

## API Routes

### Patient Registration

**POST** `/api/register/patient`

Register a new patient account.

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "+1234567890",
  "address": "123 Main St",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "+0987654321"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "patientId": "uuid-here"
}
```

**Response (Error - 400/500):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Minimum 8 characters
- Full Name: Required
- Date of Birth: Valid date, patient must be at least 1 year old
- Phone: Valid phone format

### Authentication (Login)

**Note**: Login is handled via form submission to `/login` page, not an API endpoint.

## Database Functions

### Video Call Management

#### Create Video Call

```typescript
// lib/webrtc-signaling.ts

interface CreateVideoCallResult {
  success: boolean;
  videoCallId?: string;
  error?: string;
}

async function createVideoCall(
  appointmentId: string,
  patientId: string,
  doctorId: string,
  userRole: string
): Promise<CreateVideoCallResult>
```

Creates a new video call record and associates it with an appointment.

**Parameters:**
- `appointmentId`: UUID of the appointment
- `patientId`: UUID of the patient
- `doctorId`: UUID of the doctor
- `userRole`: Role of the user creating the call

**Returns:**
- `success`: Boolean indicating operation success
- `videoCallId`: UUID of created call (if successful)
- `error`: Error message (if failed)

**Database Record Created:**
```sql
INSERT INTO video_calls (
  appointment_id,
  patient_id,
  doctor_id,
  status,
  started_at
) VALUES (
  $appointmentId,
  $patientId,
  $doctorId,
  'calling',
  NOW()
)
```

#### Update Call Status

```typescript
interface UpdateCallStatusResult {
  success: boolean;
  error?: string;
}

async function updateCallStatus(
  callId: string,
  status: 'calling' | 'accepted' | 'in-progress' | 'ended' | 'rejected',
  userId: string,
  userRole: string
): Promise<UpdateCallStatusResult>
```

Updates the status of an existing video call.

**Status Transitions:**
- `calling` → `accepted` (when doctor accepts)
- `accepted` → `in-progress` (when connection established)
- `in-progress` → `ended` (when call ends)
- `calling` → `rejected` (when doctor rejects)

#### End Video Call

```typescript
async function endVideoCall(callId: string): Promise<void>
```

Ends an active video call and updates the database.

**Actions:**
- Sets status to 'ended'
- Records ended_at timestamp
- Closes signaling channel

### Signaling Messages

#### Send Signaling Message

```typescript
interface SignalingMessage {
  callId: string;
  fromUserId: string;
  fromUserRole: string;
  toUserId: string;
  signalType: 'offer' | 'answer' | 'ice-candidate';
  signalData: any;
}

async function sendSignalingMessage(
  callId: string,
  fromUserId: string,
  fromUserRole: string,
  toUserId: string,
  signalType: string,
  signalData: any
): Promise<void>
```

Sends WebRTC signaling data between peers.

**Signal Types:**

1. **offer**: SDP offer from caller (patient)
   ```json
   {
     "type": "offer",
     "sdp": "v=0\r\no=- ..."
   }
   ```

2. **answer**: SDP answer from callee (doctor)
   ```json
   {
     "type": "answer",
     "sdp": "v=0\r\no=- ..."
   }
   ```

3. **ice-candidate**: ICE candidate for NAT traversal
   ```json
   {
     "candidate": "candidate:...",
     "sdpMLineIndex": 0,
     "sdpMid": "0"
   }
   ```

#### Get Recent Signaling Messages

```typescript
async function getRecentSignalingMessages(
  callId: string
): Promise<VideoCallSignalingMessage[]>
```

Retrieves recent signaling messages for a call (used when doctor joins).

**Returns:** Array of signaling messages ordered by creation time.

#### Subscribe to Signaling Messages

```typescript
function subscribeToSignalingMessages(
  callId: string,
  onMessage: (message: VideoCallSignalingMessage) => void,
  onError?: (error: Error) => void
): () => void
```

Subscribes to real-time signaling messages via Supabase Realtime.

**Returns:** Unsubscribe function

**Usage:**
```typescript
const unsubscribe = subscribeToSignalingMessages(
  callId,
  (message) => {
    if (message.signal_type === 'offer') {
      // Handle offer
    }
  },
  (error) => {
    console.error('Signaling error:', error);
  }
);

// Later, to cleanup:
unsubscribe();
```

### Incoming Call Notifications

```typescript
function subscribeToIncomingCalls(
  doctorId: string,
  onCall: (call: VideoCall) => void,
  onError?: (error: Error) => void
): () => void
```

Subscribes doctor to real-time notifications of incoming calls.

**Requires**: Supabase Realtime enabled on `video_calls` table

## WebRTC Configuration

### STUN/TURN Servers

Default configuration uses Google's public STUN servers:

```typescript
const DEFAULT_STUN_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302"] },
  { urls: ["stun1.l.google.com:19302"] },
  { urls: ["stun2.l.google.com:19302"] },
];
```

Custom TURN server can be configured via environment variables:
```env
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_PASSWORD=password
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Patients Table

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Doctors Table

```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  full_name VARCHAR(255) NOT NULL,
  specialization VARCHAR(100),
  license_number VARCHAR(50),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Appointments Table

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  appointment_date TIMESTAMP NOT NULL,
  duration INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Video Calls Table

```sql
CREATE TABLE video_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  status VARCHAR(50) CHECK (status IN ('calling', 'accepted', 'in-progress', 'ended', 'rejected')),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;
```

### Video Call Signaling Table

```sql
CREATE TABLE video_call_signaling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES video_calls(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  from_user_role VARCHAR(50) NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type VARCHAR(50) CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `AUTH_REQUIRED`: User must be authenticated
- `PERMISSION_DENIED`: User lacks required permissions
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate email)
- `WEBRTC_ERROR`: WebRTC operation failed

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production:

- Login attempts: 5 per 15 minutes per IP
- API calls: 100 per minute per user
- Video call creation: 10 per hour per user

## Security Considerations

1. **Input Validation**: All user input is validated before processing
2. **SQL Injection Protection**: Supabase client handles parameterization
3. **Password Security**: Passwords are hashed with bcrypt (cost factor 10)
4. **Session Security**: HTTP-only cookies prevent XSS attacks
5. **CORS**: Restricted to same origin
6. **HTTPS**: Required in production for WebRTC

## Testing

### API Testing

Use tools like Postman or curl:

```bash
# Test patient registration
curl -X POST http://localhost:3000/api/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "fullName": "Test User",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+1234567890"
  }'
```

### WebRTC Testing

See [Video Call System Documentation](VIDEO_CALL_SYSTEM.md) for comprehensive testing guide.

## Monitoring

Recommended monitoring:
- API response times
- Error rates per endpoint
- WebRTC connection success rate
- Active video call count
- Database query performance

## Future API Endpoints

Planned additions:
- [ ] GET `/api/appointments` - List appointments
- [ ] POST `/api/appointments` - Create appointment
- [ ] GET `/api/medical-records/:patientId` - Get records
- [ ] POST `/api/prescriptions` - Create prescription
- [ ] GET `/api/doctors` - List available doctors
- [ ] POST `/api/auth/logout` - Logout endpoint
- [ ] GET `/api/video-calls/:callId/recording` - Get call recording
