# Secure HealthCare System - API Documentation

## 1. Overview
The Secure HealthCare System utilizes Next.js API Routes (App Router) for its backend infrastructure, combined with Supabase for Database management, Authentication, and WebRTC real-time signaling.

All API interactions require secure, HTTP-only session cookies to authenticate the request, and endpoints strictly enforce Role-Based Access Control (RBAC).

---

## 2. Authentication & Authorization

Authentication is handled securely without exposing tokens to the client-side JavaScript environment. 

### 2.1. Session Management
*   **Mechanism:** Secure, HTTP-only cookies.
*   **Verification:** The `checkSession` utility (in `lib/auth.ts`) is used at the top of protected API routes to verify the user's identity and role.
*   **Roles:** `patient`, `doctor`, `nurse`, `admin`.

### 2.2. Login / Session Creation
*   **Action:** Form submission to the Next.js Server Actions (not a standard REST API route).
*   **Behavior:** Validates credentials via bcrypt, creates a session in Supabase, and sets the HTTP-only cookie to be sent on subsequent API requests.

---

## 3. REST API Endpoints

### 3.1. Patient Registration
**Endpoint:** `POST /api/register/patient`
**Description:** Creates a new patient account, hashes the password, and creates the corresponding profile in the `patients` table.

**Request Body (JSON):**
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!",
  "fullName": "Jane Doe",
  "dateOfBirth": "1985-10-25",
  "phoneNumber": "+1234567890",
  "address": "123 Health Ave, City",
  "emergencyContact": "John Doe",
  "emergencyPhone": "+0987654321"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration successful",
  "patientId": "uuid-string-here"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Password must be at least 8 characters long."
}
```

### 3.2. System Health Check
**Endpoint:** `GET /api/health`
**Description:** Used by load balancers and deployment platforms (like Vercel or Docker) to ensure the system is operational.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-10T12:00:00Z",
  "services": {
    "database": "up",
    "application": "up"
  }
}
```

### 3.3. Core Health Endpoints

*   **Appointments (`/api/appointments/...`)**
    *   **GET `/api/appointments`**: Retrieves a list of appointments based on the user's role (patient sees their own, doctor sees assigned).
    *   **POST `/api/appointments/create`**: Schedules a new appointment.
*   **Medical Reports (`/api/medical-reports/...`)**
    *   **GET `/api/medical-reports`**: Fetches a patient's medical history.
    *   **POST `/api/medical-reports/upload`**: Allows doctors to attach new medical documents to a patient profile.
    *   **GET `/api/medical-reports/share`**: Manages access permissions for sharing health profiles with nurses and doctors.
*   **Prescriptions (`/api/prescriptions`)**
    *   **POST `/api/prescriptions`**: Allows a doctor to issue a new digital prescription.
    *   **GET `/api/prescriptions`**: Retrieves a patient's prescription history.

### 3.4. Communication & Support Endpoints

*   **Real-time Chat (`/api/chat/...`)**
    *   Provides secure, text-based messaging between patients and medical staff parallel to the video system.
*   **AI Chatbot (`/api/chatbot/...`)**
    *   Interfaces with the locally hosted Ollama/Llama3 model to provide AI-driven medical triage and Q&A support for patients.
*   **Notifications & Email (`/api/notifications`, `/api/email`)**
    *   Triggers email dispatch (via Resend/SMTP) and in-app alerts for critical events like upcoming appointments and password resets.

### 3.5. Administrative Endpoints

*   **Audit Logging (`/api/audit/...`)**
    *   Records sensitive system events (logins, failed attempts, data access) for compliance parsing.
*   **Admin Management (`/api/admin/...`)**
    *   Elevated routes for system administrators to manage users, suspend accounts, and view telemetry.

Video consultations do not use standard REST APIs for the actual call. Instead, they utilize Supabase Realtime (WebSockets) to exchange WebRTC signaling data.

### 4.1. Call Initialization
Instead of a REST endpoint, the frontend uses the `createVideoCall` database function to insert a record into the `video_calls` table. 
*   **Status Flow:** `calling` → `accepted` → `in-progress` → `ended`.

### 4.2. WebRTC Signaling Data Types
Peers exchange the following payload structures via the `video_call_signaling` table:

**SDP Offer (from Patient):**
```json
{
  "callId": "uuid-call-id",
  "fromUserId": "uuid-patient-id",
  "toUserId": "uuid-doctor-id",
  "signalType": "offer",
  "signalData": {
    "type": "offer",
    "sdp": "v=0\r\no=- ..."
  }
}
```

**SDP Answer (from Doctor):**
```json
{
  "callId": "uuid-call-id",
  "fromUserId": "uuid-doctor-id",
  "toUserId": "uuid-patient-id",
  "signalType": "answer",
  "signalData": {
    "type": "answer",
    "sdp": "v=0\r\no=- ..."
  }
}
```

**ICE Candidates (Network Traversal):**
```json
{
  "callId": "uuid-call-id",
  "fromUserId": "uuid-sender-id",
  "toUserId": "uuid-receiver-id",
  "signalType": "ice-candidate",
  "signalData": {
    "candidate": "candidate:842163049 1 udp 1677729535...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

---

## 5. Standard Error Handling
All custom API routes follow a standardized error response schema to make frontend consumption predictable.

```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "AUTH_REQUIRED" // e.g., PERMISSION_DENIED, VALIDATION_ERROR, NOT_FOUND
}
```

## 6. Rate Limiting & Security 
*   **CORS:** Configured to strictly deny Cross-Origin requests; APIs are only accessible from the same domain.
*   **Rate Limiting:** Managed at the API Edge (via Limiter/Vercel) to prevent brute-force attacks on the `/api/register` endpoint.
*   **SQL Injection:** Prevented natively via Supabase's prepared statements and ORM design.
