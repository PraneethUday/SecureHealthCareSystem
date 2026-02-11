# Secure Healthcare System - Complete Backend API Documentation

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Health Check](#health-check)
3. [User Registration](#user-registration)
4. [Admin Endpoints](#admin-endpoints)
5. [Audit & Logging](#audit--logging)
6. [Medical Reports](#medical-reports)
7. [Prescriptions](#prescriptions)
8. [Appointments](#appointments)
9. [Video Calls](#video-calls)
10. [Chatbot](#chatbot)
11. [Server Actions](#server-actions)
12. [Error Codes](#error-codes)

---

## Base URL

```
http://localhost:3000/api
```

## Authentication & Authorization

### POST `/api/auth/verify-otp`

Verify Multi-Factor Authentication (MFA) OTP code during login.

**Request Body:**

```json
{
  "mfaToken": "string",
  "otp": "string",
  "role": "patient" | "doctor" | "nurse" | "staff" | "admin"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  },
  "role": "string"
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid OTP or token
- `500 Internal Server Error`: Server error

---

## Health Check

### GET `/api/health`

Check the health status of the API.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## User Registration

### POST `/api/register/patient`

Register a new patient account.

**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "Male" | "Female" | "Other",
  "phoneNumber": "string",
  "address": "string",
  "emergencyContact": "string",
  "bloodGroup": "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-",
  "allergies": "string (optional)"
}
```

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful! Please verify your email.",
  "patient_id": "P001",
  "email": "patient@example.com"
}
```

**Error Responses:**

- `400 Bad Request`: Missing fields or invalid password
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Server error

---

## Admin Endpoints

All admin endpoints require `adminId=admin` query parameter for authorization.

### GET `/api/admin/statistics`

Get system-wide statistics (admin only).

**Query Parameters:**

- `adminId` (required): Must be "admin"

**Response (200 OK):**

```json
{
  "totalPatients": 150,
  "totalDoctors": 25,
  "totalNurses": 40,
  "totalStaff": 15,
  "totalUsers": 230
}
```

**Error Responses:**

- `403 Forbidden`: Unauthorized access
- `500 Internal Server Error`: Server error

---

### GET `/api/admin/users`

Get all users in the system (admin only).

**Query Parameters:**

- `adminId` (required): Must be "admin"
- `role` (optional): Filter by role ("doctor", "nurse", "staff")

**Response (200 OK):**

```json
{
  "users": [
    {
      "id": "uuid",
      "userId": "D001",
      "role": "doctor",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "doctor@example.com",
      "phone": "+1234567890",
      "department": "Cardiology",
      "specialization": "Cardiologist",
      "licenseNumber": "MED12345",
      "yearsOfExperience": 10,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "isMfaEnabled": true
    }
  ],
  "total": 100,
  "roles": ["doctor", "nurse", "staff"]
}
```

**Error Responses:**

- `403 Forbidden`: Unauthorized access
- `500 Internal Server Error`: Server error

---

### DELETE `/api/admin/users`

Delete a user from the system (admin only).

**Query Parameters:**

- `adminId` (required): Must be "admin"
- `userId` (required): User's ID (e.g., "D001", "N001")
- `role` (required): User's role ("doctor", "nurse", "staff")

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Missing required parameters or invalid role
- `403 Forbidden`: Unauthorized access
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### POST `/api/admin/users/create`

Create a new user (doctor, nurse, or staff) - admin only.

**Request Body:**

```json
{
  "adminId": "admin",
  "role": "doctor" | "nurse" | "staff",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "department": "string",

  // Doctor-specific fields (if role = "doctor")
  "specialization": "string",
  "licenseNumber": "string",
  "yearsOfExperience": 10,

  // Nurse-specific fields (if role = "nurse")
  "licenseNumber": "string",
  "shift": "morning" | "evening" | "night",

  // Staff-specific fields (if role = "staff")
  "staffRole": "string"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "D001",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing fields or invalid data
- `403 Forbidden`: Unauthorized access
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

---

## Audit & Logging

### POST `/api/audit`

Log an audit action.

**Request Body:**

```json
{
  "user_id": "string",
  "user_role": "patient" | "doctor" | "nurse" | "staff" | "admin",
  "action": "string",
  "resource_type": "string (optional)",
  "resource_id": "string (optional)",
  "details": "string (optional)",
  "status": "success" | "failure",
  "ip_address": "string (optional)",
  "user_agent": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "ok": true
}
```

**Error Responses:**

- `500 Internal Server Error`: Database insert failed

---

### GET `/api/audit/logs`

Retrieve audit logs with optional filtering.

**Query Parameters:**

- `limit` (optional): Number of logs to retrieve (default: 50)
- `patientId` (optional): Filter logs by patient ID

**Response (200 OK):**

```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "P001",
      "user_role": "patient",
      "action": "login_success",
      "resource_type": "authentication",
      "resource_id": null,
      "details": "Logged in successfully",
      "status": "success",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2026-02-11T10:30:00.000Z",
      "blockchain_verified": false
    }
  ]
}
```

**Error Responses:**

- `500 Internal Server Error`: Query error

---

## Medical Reports

### POST `/api/medical-reports`

Upload a medical report.

**Request (multipart/form-data):**

- `patientId` (required): Patient ID (e.g., "P001")
- `reportType` (required): Type of report (e.g., "Lab Test", "X-Ray", "MRI")
- `reportName` (required): Name of the report
- `description` (optional): Report description
- `reportDate` (optional): Date of the report (YYYY-MM-DD)
- `notes` (optional): Additional notes
- `uploadedByUserId` (required): ID of the uploader
- `uploadedByRole` (required): Role of the uploader
- `file` (required): Report file (max 50MB)

**Response (200 OK):**

```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "patient_id": "uuid",
    "report_type": "Lab Test",
    "report_name": "Blood Test Results",
    "file_url": "https://...",
    "file_name": "blood_test.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "report_date": "2026-02-11",
    "created_at": "2026-02-11T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing fields or file too large
- `404 Not Found`: Patient not found
- `500 Internal Server Error`: Upload or database error

---

### GET `/api/medical-reports`

Retrieve medical reports with optional filtering.

**Query Parameters:**

- `patientId` (optional): Filter by patient ID
- `reportType` (optional): Filter by report type

**Response (200 OK):**

```json
{
  "reports": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "report_type": "Lab Test",
      "report_name": "Blood Test Results",
      "description": "Annual checkup",
      "file_url": "https://...",
      "file_name": "blood_test.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "report_date": "2026-02-11",
      "notes": "All values normal",
      "uploaded_by_user_id": "D001",
      "uploaded_by_role": "doctor",
      "created_at": "2026-02-11T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `500 Internal Server Error`: Query error

---

### GET `/api/medical-reports/download`

Generate a signed URL to download a medical report.

**Query Parameters:**

- `reportId` (optional): Report ID
- `fileName` (optional): File name (required if reportId not provided)

**Response (200 OK):**

```json
{
  "downloadUrl": "https://signed-url...",
  "fileName": "P001/blood_test.pdf"
}
```

**Error Responses:**

- `400 Bad Request`: Missing reportId or fileName
- `404 Not Found`: Report not found
- `500 Internal Server Error`: URL generation error

---

### POST `/api/medical-reports/log-view`

Log when a user views a medical report.

**Request Body:**

```json
{
  "reportId": "uuid",
  "userId": "string",
  "userRole": "patient" | "doctor" | "nurse" | "staff" | "admin"
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Logging error

---

## Prescriptions

### GET `/api/prescriptions/search`

Search prescriptions with multiple filters.

**Query Parameters:**

- `patientId` (optional): Filter by patient ID
- `patientName` (optional): Search by patient name
- `status` (optional): Filter by status ("active", "completed", "cancelled", "all")

**Response (200 OK):**

```json
{
  "prescriptions": [
    {
      "id": "uuid",
      "prescription_id": "RX001",
      "patient_id": "P001",
      "doctor_id": "D001",
      "medication_name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "Three times daily",
      "duration": "7 days",
      "instructions": "Take with food",
      "status": "active",
      "prescribed_date": "2026-02-11",
      "valid_until": "2026-02-18",
      "doctor_name": "Dr. John Smith",
      "doctor_specialization": "General Practice",
      "patient_name": "Jane Doe",
      "patient_email": "jane@example.com",
      "patient_phone": "+1234567890",
      "created_at": "2026-02-11T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `500 Internal Server Error`: Query error

---

## Appointments

### GET `/api/appointments/[appointmentId]/details`

Get detailed information about a specific appointment.

**Path Parameters:**

- `appointmentId` (required): Appointment UUID

**Response (200 OK):**

```json
{
  "appointment_date": "2026-02-15",
  "appointment_time": "10:00:00",
  "reason": "Annual checkup",
  "type": "in-person",
  "patient_name": "John Doe"
}
```

**Error Responses:**

- `404 Not Found`: Appointment not found
- `500 Internal Server Error`: Query error

---

## Video Calls

### POST `/api/video-calls/initiate`

Initiate a video call for an appointment (patient only).

**Request Body:**

```json
{
  "appointmentId": "uuid",
  "doctorId": "uuid",
  "userId": "uuid",
  "userRole": "patient"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "callId": "uuid",
  "appointment": {
    "id": "uuid",
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "status": "scheduled"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid doctor ID or appointment status
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only patients can initiate calls or unauthorized appointment access
- `404 Not Found`: Appointment not found
- `500 Internal Server Error`: Call creation error

---

## Chatbot

### POST `/api/chatbot`

Send a message to the AI healthcare assistant.

**Request Body:**

```json
{
  "message": "string",
  "context": {
    "role": "patient" | "doctor" | "nurse" | "staff",
    "page": "string"
  }
}
```

**Response (200 OK):**

```json
{
  "reply": "I'm here to help with general health information and system navigation. How can I assist you today?"
}
```

**Chatbot Capabilities:**

- General health education
- System usage guidance
- Navigation help
- Symptom guidance (advises users to see a doctor for diagnosis)

**Chatbot Limitations:**

- Does NOT diagnose diseases
- Does NOT prescribe medication
- Does NOT provide treatment plans

**Error Responses:**

- `400 Bad Request`: No message provided
- `500 Internal Server Error`: AI service unavailable
- `504 Gateway Timeout`: AI took too long to respond

---

## Server Actions

Server actions are Next.js server-side functions called directly from the client.

### `login(identifier, password, role)`

Authenticate a user and handle MFA if enabled.

**Parameters:**

```typescript
identifier: string; // Email or User ID
password: string;
role: "patient" | "doctor" | "nurse" | "staff" | "admin";
```

**Returns:**

```typescript
{
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  role?: UserRole;
  requiresMFA?: boolean;
  mfaToken?: string;
  requiresPasswordChange?: boolean;
}
```

**Features:**

- Account lockout protection (5 attempts, 30-minute lockout)
- Password expiry check (90 days)
- MFA support with OTP via email
- Audit logging
- Session management

---

### `verifyMFAOTP(mfaToken, otp, role)`

Verify the OTP code for multi-factor authentication.

**Parameters:**

```typescript
mfaToken: string; // Temporary token from login
otp: string; // 6-digit OTP code
role: UserRole;
```

**Returns:**

```typescript
{
  success: boolean;
  message: string;
  user?: object;
  role?: UserRole;
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning               | Description                            |
| ---- | --------------------- | -------------------------------------- |
| 200  | OK                    | Request successful                     |
| 201  | Created               | Resource created successfully          |
| 400  | Bad Request           | Invalid request data or missing fields |
| 401  | Unauthorized          | Authentication failed or token invalid |
| 403  | Forbidden             | User lacks permission for this action  |
| 404  | Not Found             | Resource not found                     |
| 409  | Conflict              | Resource already exists (e.g., email)  |
| 500  | Internal Server Error | Server-side error                      |
| 504  | Gateway Timeout       | Request timed out                      |

---

## Security Features

### Authentication

- Bcrypt password hashing
- Session-based authentication
- Role-based access control (RBAC)
- Multi-factor authentication (MFA) via email OTP

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Expires after 90 days

### Account Protection

- Account lockout after 5 failed login attempts
- 30-minute lockout duration
- Manual admin lockout capability
- Real-time lockout status checking

### Audit Logging

All significant actions are logged including:

- Authentication attempts (success/failure)
- Resource access (view, create, update, delete)
- Administrative actions
- File uploads and downloads
- Video call initiations
- Timestamps, IP addresses, and user agents

---

## Rate Limiting

Currently, there are no explicit rate limits implemented. Consider implementing rate limiting for:

- Login attempts (already handled by account lockout)
- OTP requests
- API endpoints (general)
- File uploads

---

## File Upload Limits

| Endpoint               | Max File Size | Allowed Types          |
| ---------------------- | ------------- | ---------------------- |
| `/api/medical-reports` | 50 MB         | PDF, Images, Documents |

---

## Database Schema

### User Tables

- `patients` - Patient information and credentials
- `doctors` - Doctor information and credentials
- `nurses` - Nurse information and credentials
- `staff` - Staff member information and credentials
- `admins` - Administrator credentials

### Medical Data Tables

- `appointments` - Appointment scheduling
- `medical_records` - Patient medical history
- `medical_reports` - Uploaded medical documents
- `prescriptions` - Prescription information
- `vitals` - Patient vital signs

### System Tables

- `access_logs` - Audit trail of all system actions
- `medical_report_logs` - Specific logs for report access
- `account_locks` - Account lockout tracking
- `video_calls` - Video call sessions
- `otp_codes` - Multi-factor authentication codes

---

## Environment Variables

Required environment variables for the backend:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Session
SESSION_SECRET=your_session_secret

# Zoom (Optional for video calls)
NEXT_PUBLIC_ZOOM_SDK_KEY=your_zoom_sdk_key
ZOOM_SDK_SECRET=your_zoom_sdk_secret

# Ollama (For chatbot)
OLLAMA_API_URL=http://127.0.0.1:11434
```

---

## Testing Endpoints

### Using cURL

**Health Check:**

```bash
curl http://localhost:3000/api/health
```

**Login (via Server Action):**

```bash
# Server actions can't be tested directly with cURL
# Use the login page at http://localhost:3000/login
```

**Get Statistics (Admin):**

```bash
curl "http://localhost:3000/api/admin/statistics?adminId=admin"
```

**Upload Medical Report:**

```bash
curl -X POST \
  -F "patientId=P001" \
  -F "reportType=Lab Test" \
  -F "reportName=Blood Test" \
  -F "uploadedByUserId=D001" \
  -F "uploadedByRole=doctor" \
  -F "file=@/path/to/report.pdf" \
  http://localhost:3000/api/medical-reports
```

---

## API Changelog

### Version 1.0.0 (Current)

- Initial API implementation
- Authentication with MFA support
- Patient registration
- Admin user management
- Medical reports upload/download
- Prescription search
- Audit logging
- Video call initiation
- AI chatbot integration

---

## Support & Contact

For API support or questions:

- Review the documentation thoroughly
- Check error messages and logs
- Verify authentication and authorization
- Ensure all required fields are provided
- Check environment variables are set correctly

---

## Future Enhancements

Planned features for future API versions:

- [ ] Rate limiting implementation
- [ ] API versioning (v1, v2, etc.)
- [ ] GraphQL endpoint
- [ ] WebSocket support for real-time updates
- [ ] Push notifications API
- [ ] Advanced analytics endpoints
- [ ] Bulk operations support
- [ ] Export/Import APIs
- [ ] Third-party integrations
- [ ] Mobile app-specific endpoints
