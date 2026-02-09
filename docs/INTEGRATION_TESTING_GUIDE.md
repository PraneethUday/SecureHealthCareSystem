# SecureHealthCareSystem - Integration Testing Guide

## Manual Testing Documentation for QA Testers

**Version:** 1.0  
**Last Updated:** February 2026  
**Document Owner:** QA Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environment Setup](#2-test-environment-setup)
3. [User Roles & Test Accounts](#3-user-roles--test-accounts)
4. [Feature Test Cases](#4-feature-test-cases)
   - [Authentication](#41-authentication)
   - [Patient Registration](#42-patient-registration)
   - [Appointments](#43-appointments)
   - [Medical Records](#44-medical-records)
   - [Prescriptions](#45-prescriptions)
   - [Medical Reports](#46-medical-reports)
   - [Video Calls (Telemedicine)](#47-video-calls-telemedicine)
   - [AI Chatbot](#48-ai-chatbot)
   - [Audit Logging](#49-audit-logging)
   - [Admin Dashboard](#410-admin-dashboard)
5. [Cross-Functional Testing](#5-cross-functional-testing)
6. [Security Testing](#6-security-testing)
7. [Performance Testing](#7-performance-testing)
8. [Bug Reporting Template](#8-bug-reporting-template)
9. [Test Execution Checklist](#9-test-execution-checklist)

---

## 1. Introduction

### Purpose
This document provides comprehensive integration testing procedures for the SecureHealthCareSystem application. It covers end-to-end testing scenarios that validate the complete user workflows across all system components.

### Scope
- Web application frontend testing
- API endpoint integration testing
- Database operations verification
- Cross-browser compatibility
- User role-based access control
- Security feature validation

### Prerequisites
- Access to the test environment
- Valid test user credentials for all roles
- Understanding of healthcare workflow processes
- Knowledge of the application's features

---

## 2. Test Environment Setup

### Environment URLs
| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `http://localhost:3000` | Local testing |
| Staging | `https://staging.securehealthcare.com` | Pre-production testing |
| Production | `https://securehealthcare.com` | Live environment (read-only testing) |

### Browser Requirements
Test on the following browsers:
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Microsoft Edge (latest version)
- Safari (latest version on macOS)

### Database Setup
Before testing, ensure:
1. Test database is populated with seed data
2. All required tables exist (patients, doctors, hospitals, appointments, etc.)
3. Test users are created for each role

### Required Services
Verify these services are running:
- [ ] Next.js application server
- [ ] Supabase database connection
- [ ] Ollama AI service (for chatbot testing)
- [ ] WebRTC signaling server (for video calls)

---

## 3. User Roles & Test Accounts

### Role Matrix

| Role | Capabilities | Test Account |
|------|--------------|--------------|
| **Patient** | View appointments, medical records, prescriptions; Book appointments; Initiate video calls | Email: `testpatient@example.com` |
| **Doctor** | View patient records; Create diagnoses; Write prescriptions; Accept video calls; Update appointment status | ID: `D001` |
| **Nurse** | View patient vitals; Assist with appointments; Update patient notes | ID: `N001` |
| **Staff** | Pharmacy operations; Dispense prescriptions; Patient lookup | ID: `S001` |
| **Admin** | Full system access; User management; Audit logs; System configuration | ID: `admin1` |

### Test Password
All test accounts use password: `TestPass123!`

> ⚠️ **IMPORTANT**: Never use these credentials in production environments.

---

## 4. Feature Test Cases

### 4.1 Authentication

#### TC-AUTH-001: Patient Login with Email
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Patient account exists in database |

**Steps:**
1. Navigate to `/login`
2. Select "Patient" role
3. Enter patient email
4. Enter password
5. Click "Login" button

**Expected Results:**
- ✅ User is redirected to patient dashboard
- ✅ Session is created (check sessionStorage)
- ✅ Login action is logged in audit trail
- ✅ Welcome message displays patient name

---

#### TC-AUTH-002: Doctor Login with Doctor ID
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Doctor account exists |

**Steps:**
1. Navigate to `/login`
2. Select "Doctor" role
3. Enter doctor ID (e.g., D001)
4. Enter password
5. Click "Login"

**Expected Results:**
- ✅ User is redirected to doctor dashboard
- ✅ Doctor's appointments are displayed
- ✅ Navigation shows doctor-specific options

---

#### TC-AUTH-003: Invalid Credentials
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | None |

**Steps:**
1. Navigate to `/login`
2. Select any role
3. Enter invalid credentials
4. Click "Login"

**Expected Results:**
- ✅ Error message: "Invalid credentials"
- ✅ User remains on login page
- ✅ Failed login attempt is logged

---

#### TC-AUTH-004: Session Persistence
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Valid user account |

**Steps:**
1. Login successfully
2. Refresh the page
3. Navigate to different sections
4. Close and reopen browser tab

**Expected Results:**
- ✅ Session persists during page refresh
- ✅ User remains logged in across navigation
- ✅ Session clears when browser is closed

---

#### TC-AUTH-005: Logout
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | User is logged in |

**Steps:**
1. Click "Logout" button
2. Verify redirect to login page
3. Try to access protected page directly

**Expected Results:**
- ✅ Session is cleared
- ✅ User is redirected to login
- ✅ Cannot access protected routes
- ✅ Logout action is logged

---

### 4.2 Patient Registration

#### TC-REG-001: Successful Patient Registration
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Email not already registered |

**Steps:**
1. Navigate to `/register`
2. Fill in all required fields:
   - First Name: "Test"
   - Last Name: "User"
   - Email: unique email
   - Password: valid password
   - Date of Birth: valid date
   - Gender: select option
   - Phone Number: valid phone
   - Address: valid address
   - Emergency Contact: valid phone
   - Blood Group: select option
3. Click "Register"

**Expected Results:**
- ✅ Success message displayed
- ✅ Patient ID generated (e.g., P006)
- ✅ Redirected to login page
- ✅ Can login with new credentials

---

#### TC-REG-002: Duplicate Email Registration
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Email already exists |

**Steps:**
1. Navigate to `/register`
2. Enter existing email
3. Fill other fields
4. Click "Register"

**Expected Results:**
- ✅ Error: "Email already registered"
- ✅ User remains on registration page

---

#### TC-REG-003: Required Field Validation
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | None |

**Steps:**
1. Navigate to `/register`
2. Leave each required field empty one at a time
3. Try to submit

**Expected Results:**
- ✅ Validation error for each empty field
- ✅ Form does not submit

---

### 4.3 Appointments

#### TC-APT-001: Book New Appointment
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Logged in as patient |

**Steps:**
1. Navigate to Appointments > Book New
2. Select hospital
3. Select doctor (filtered by hospital)
4. Select date (future date)
5. Select available time slot
6. Enter reason for visit
7. Select appointment type (In-person/Telemedicine)
8. Click "Book Appointment"

**Expected Results:**
- ✅ Success confirmation displayed
- ✅ Appointment appears in "My Appointments" list
- ✅ Status shows "Scheduled"
- ✅ Booking is logged in audit trail

---

#### TC-APT-002: View Patient Appointments
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Patient has appointments |

**Steps:**
1. Login as patient
2. Navigate to "My Appointments"

**Expected Results:**
- ✅ All patient appointments displayed
- ✅ Shows doctor name, date, time, status
- ✅ Can filter by status
- ✅ Sorted by date (newest first)

---

#### TC-APT-003: Doctor Views Appointments
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Doctor has patient appointments |

**Steps:**
1. Login as doctor
2. Navigate to "My Appointments"

**Expected Results:**
- ✅ All assigned appointments displayed
- ✅ Shows patient name, date, time, reason
- ✅ Can update appointment status
- ✅ Can access patient details

---

#### TC-APT-004: Cancel Appointment
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Scheduled appointment exists |

**Steps:**
1. Navigate to appointment details
2. Click "Cancel Appointment"
3. Enter cancellation reason (optional)
4. Confirm cancellation

**Expected Results:**
- ✅ Appointment status changes to "Cancelled"
- ✅ Time slot becomes available again
- ✅ Cancellation logged

---

#### TC-APT-005: Complete Appointment
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Doctor has scheduled appointment |

**Steps:**
1. Login as doctor
2. Navigate to appointment
3. Mark as "Completed"

**Expected Results:**
- ✅ Status changes to "Completed"
- ✅ Can now add medical record
- ✅ Can add prescriptions
- ✅ Completion logged

---

### 4.4 Medical Records

#### TC-MR-001: Create Medical Record
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Completed appointment exists |

**Steps:**
1. Login as doctor
2. Navigate to completed appointment
3. Click "Add Medical Record"
4. Fill in:
   - Chief Complaint
   - Diagnosis
   - Treatment Plan
   - Notes
5. Save record

**Expected Results:**
- ✅ Medical record created
- ✅ Linked to appointment
- ✅ Patient can view record
- ✅ Creation logged

---

#### TC-MR-002: Patient Views Medical Records
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Patient has medical records |

**Steps:**
1. Login as patient
2. Navigate to "Medical Records"

**Expected Results:**
- ✅ All records displayed
- ✅ Shows date, doctor, diagnosis
- ✅ Can view full details
- ✅ View action is logged

---

#### TC-MR-003: Download Medical Record PDF
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Medical record exists |

**Steps:**
1. View medical record
2. Click "Download PDF"

**Expected Results:**
- ✅ PDF generated with all record details
- ✅ Includes patient info, diagnosis, treatment
- ✅ Download logged in audit trail

---

#### TC-MR-004: Update Medical Record
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Doctor created the record |

**Steps:**
1. Login as doctor
2. Navigate to existing record
3. Click "Edit"
4. Update fields
5. Save changes

**Expected Results:**
- ✅ Record updated
- ✅ Update timestamp changed
- ✅ Update logged with old/new values

---

### 4.5 Prescriptions

#### TC-RX-001: Create Prescription
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Completed appointment |

**Steps:**
1. Login as doctor
2. Navigate to appointment
3. Click "Add Prescription"
4. Fill in:
   - Medication Name
   - Dosage
   - Frequency
   - Duration
   - Start Date
5. Save prescription

**Expected Results:**
- ✅ Prescription created with "Active" status
- ✅ Linked to patient and appointment
- ✅ Patient can view prescription
- ✅ Creation logged

---

#### TC-RX-002: Patient Views Prescriptions
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Patient has prescriptions |

**Steps:**
1. Login as patient
2. Navigate to "My Prescriptions"

**Expected Results:**
- ✅ All prescriptions displayed
- ✅ Shows medication, dosage, doctor
- ✅ Status clearly visible
- ✅ Access logged

---

#### TC-RX-003: Pharmacy Search Prescriptions
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Staff role access |

**Steps:**
1. Login as staff
2. Navigate to "Prescription Search"
3. Search by patient ID or name
4. Filter by status

**Expected Results:**
- ✅ Matching prescriptions displayed
- ✅ Can view patient details
- ✅ Can see prescription history

---

#### TC-RX-004: Mark Prescription Dispensed
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Active prescription exists |

**Steps:**
1. Login as staff
2. Find prescription
3. Click "Mark as Dispensed"
4. Add dispensing notes (optional)
5. Confirm

**Expected Results:**
- ✅ Status changes to "Completed"
- ✅ Dispensed timestamp recorded
- ✅ Staff ID recorded
- ✅ Action logged

---

#### TC-RX-005: Doctor Discontinues Prescription
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Active prescription exists |

**Steps:**
1. Login as doctor
2. Navigate to prescription
3. Click "Discontinue"
4. Enter reason
5. Confirm

**Expected Results:**
- ✅ Status changes to "Discontinued"
- ✅ Reason recorded
- ✅ Discontinuation logged

---

### 4.6 Medical Reports

#### TC-REP-001: Upload Medical Report
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Doctor/nurse logged in |

**Steps:**
1. Navigate to Medical Reports
2. Click "Upload Report"
3. Select patient
4. Choose report type (Lab Test, X-Ray, etc.)
5. Enter report name
6. Add description
7. Upload file (PDF/image)
8. Submit

**Expected Results:**
- ✅ File uploaded successfully
- ✅ Report linked to patient
- ✅ Visible in patient's records
- ✅ Upload logged

---

#### TC-REP-002: View Medical Report
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Report exists for patient |

**Steps:**
1. Login as patient/doctor
2. Navigate to patient's reports
3. Click on report to view

**Expected Results:**
- ✅ Report displays correctly
- ✅ File can be viewed/downloaded
- ✅ View action logged

---

#### TC-REP-003: Download Medical Report
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Report exists |

**Steps:**
1. Navigate to report
2. Click "Download"

**Expected Results:**
- ✅ Signed URL generated
- ✅ File downloads correctly
- ✅ Download logged

---

#### TC-REP-004: Filter Reports by Type
| Field | Value |
|-------|-------|
| **Priority** | Low |
| **Preconditions** | Multiple report types exist |

**Steps:**
1. Navigate to Medical Reports
2. Use type filter dropdown
3. Select specific type

**Expected Results:**
- ✅ Only matching reports shown
- ✅ Filter persists during navigation

---

### 4.7 Video Calls (Telemedicine)

#### TC-VC-001: Patient Initiates Video Call
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Telemedicine appointment scheduled |

**Steps:**
1. Login as patient
2. Navigate to telemedicine appointment
3. Click "Start Video Call"
4. Allow camera/microphone access
5. Wait for doctor to answer

**Expected Results:**
- ✅ Video call initiated
- ✅ Patient video/audio working
- ✅ Call status shows "Calling"
- ✅ Doctor receives notification

---

#### TC-VC-002: Doctor Answers Video Call
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Patient initiated call |

**Steps:**
1. Login as doctor
2. Receive incoming call notification
3. Click "Accept Call"
4. Allow camera/microphone

**Expected Results:**
- ✅ Video connection established
- ✅ Both parties can see/hear each other
- ✅ Call status shows "Connected"

---

#### TC-VC-003: End Video Call
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Active video call |

**Steps:**
1. Click "End Call" button

**Expected Results:**
- ✅ Call ends for both parties
- ✅ Call duration recorded
- ✅ Status changes to "Ended"
- ✅ Call log created

---

#### TC-VC-004: Mute/Unmute Audio
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Active video call |

**Steps:**
1. Click mute button
2. Verify other party cannot hear
3. Click unmute
4. Verify audio restored

**Expected Results:**
- ✅ Mute icon toggles
- ✅ Audio successfully muted/unmuted
- ✅ Other party audio unaffected

---

#### TC-VC-005: Disable/Enable Video
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Active video call |

**Steps:**
1. Click video disable button
2. Verify other party sees placeholder
3. Click enable
4. Verify video restored

**Expected Results:**
- ✅ Video icon toggles
- ✅ Video successfully disabled/enabled
- ✅ Other party notified of status

---

### 4.8 AI Chatbot

#### TC-CB-001: Ask Health Question
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Ollama service running |

**Steps:**
1. Login as any user
2. Open chatbot interface
3. Type health question
4. Send message

**Expected Results:**
- ✅ Response received within 30 seconds
- ✅ Response is helpful and appropriate
- ✅ No medical diagnoses given
- ✅ Suggests seeing doctor for serious symptoms

---

#### TC-CB-002: Ask Navigation Question
| Field | Value |
|-------|-------|
| **Priority** | Low |
| **Preconditions** | None |

**Steps:**
1. Open chatbot
2. Ask "How do I book an appointment?"

**Expected Results:**
- ✅ Step-by-step guidance provided
- ✅ Relevant to user's role

---

#### TC-CB-003: Chatbot Safety Guardrails
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | None |

**Steps:**
1. Open chatbot
2. Ask for specific medication prescription
3. Ask for diagnosis

**Expected Results:**
- ✅ Chatbot refuses to diagnose
- ✅ Chatbot refuses to prescribe
- ✅ Recommends consulting healthcare provider

---

### 4.9 Audit Logging

#### TC-LOG-001: Verify Login Logging
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Admin access |

**Steps:**
1. Perform login as patient
2. Login as admin
3. View audit logs

**Expected Results:**
- ✅ Login action recorded
- ✅ Timestamp accurate
- ✅ User ID recorded
- ✅ Action type: "login_success"

---

#### TC-LOG-002: Verify Data Access Logging
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Admin access |

**Steps:**
1. As doctor, view patient medical record
2. As admin, check audit logs

**Expected Results:**
- ✅ Access logged
- ✅ Resource ID (record ID) recorded
- ✅ User who accessed recorded
- ✅ Timestamp accurate

---

#### TC-LOG-003: Filter Audit Logs
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Multiple log entries exist |

**Steps:**
1. Login as admin
2. Navigate to Audit Logs
3. Filter by date range
4. Filter by user
5. Filter by action type

**Expected Results:**
- ✅ Filters work correctly
- ✅ Results match criteria
- ✅ Can combine multiple filters

---

### 4.10 Admin Dashboard

#### TC-ADMIN-001: View System Statistics
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Admin login |

**Steps:**
1. Login as admin
2. View dashboard

**Expected Results:**
- ✅ Total patients count displayed
- ✅ Total doctors count displayed
- ✅ Active appointments count
- ✅ Recent activity summary

---

#### TC-ADMIN-002: View All Users
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Admin login |

**Steps:**
1. Navigate to Users section
2. View patient list
3. View doctor list
4. View staff list

**Expected Results:**
- ✅ All users displayed
- ✅ Searchable by name/ID
- ✅ Can view user details

---

---

## 5. Cross-Functional Testing

### 5.1 Role Switching Workflow

**Scenario:** Complete patient journey from registration to prescription fulfillment

**Steps:**
1. Register new patient
2. Patient books appointment with doctor
3. Doctor marks appointment complete
4. Doctor creates medical record
5. Doctor writes prescription
6. Staff dispenses prescription
7. Patient views their records

**Expected:** All steps complete successfully with proper audit logging

---

### 5.2 Data Consistency

**Scenario:** Verify data integrity across roles

**Steps:**
1. Doctor creates prescription for patient
2. Login as patient, verify prescription visible
3. Login as staff, search for prescription
4. Verify all views show same data

**Expected:** Data consistent across all views

---

## 6. Security Testing

### 6.1 Authorization Tests

| Test | Steps | Expected |
|------|-------|----------|
| Patient cannot access doctor dashboard | Login as patient, navigate to `/dashboard/doctor` | Access denied or redirect |
| Staff cannot create prescriptions | Try to access prescription creation | Access denied |
| Unauthenticated user blocked | Access any dashboard route without login | Redirect to login |

### 6.2 Session Security

| Test | Steps | Expected |
|------|-------|----------|
| Session expiry | Leave session idle for extended period | Requires re-login |
| Session isolation | Open in private browser | No session carried over |

### 6.3 Input Validation

| Test | Input | Expected |
|------|-------|----------|
| XSS attempt in chat | `<script>alert('xss')</script>` | Sanitized, no script execution |
| SQL injection in search | `' OR 1=1 --` | Safe query, no injection |
| Large file upload | 100MB file | Rejected with size error |

---

## 7. Performance Testing

### 7.1 Load Times

| Page | Maximum Load Time |
|------|-------------------|
| Login page | < 2 seconds |
| Dashboard | < 3 seconds |
| Appointments list | < 2 seconds |
| Medical records | < 3 seconds |

### 7.2 Concurrent Users

Test with 50+ concurrent users:
- Login simultaneously
- Book appointments simultaneously
- View records simultaneously

---

## 8. Bug Reporting Template

```markdown
## Bug Report

**ID:** BUG-XXXX
**Title:** [Brief description]
**Priority:** [Critical/High/Medium/Low]
**Severity:** [Blocker/Major/Minor/Trivial]

### Environment
- Browser: [Chrome 120 / Firefox 122 / etc.]
- OS: [Windows 11 / macOS 14 / etc.]
- Environment: [Development / Staging]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshots/Videos
[Attach evidence]

### Additional Notes
[Any other relevant information]
```

---

## 9. Test Execution Checklist

### Pre-Test Checklist
- [ ] Test environment is accessible
- [ ] Test data is seeded
- [ ] All services are running
- [ ] Test accounts are working

### Test Execution
- [ ] Authentication tests completed
- [ ] Registration tests completed
- [ ] Appointments tests completed
- [ ] Medical records tests completed
- [ ] Prescriptions tests completed
- [ ] Medical reports tests completed
- [ ] Video calls tests completed
- [ ] Chatbot tests completed
- [ ] Audit logging tests completed
- [ ] Admin dashboard tests completed
- [ ] Cross-functional tests completed
- [ ] Security tests completed
- [ ] Performance tests completed

### Post-Test Checklist
- [ ] All bugs documented
- [ ] Test results recorded
- [ ] Screenshots captured for failures
- [ ] Test data cleaned up (if needed)

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 2026 | QA Team | Initial document creation |

---

**End of Document**
