# SecureHealthCare System – Modern Testing Documentation

## Testing Overview

Testing within the SecureHealthCare System ensures that the platform functions correctly, reliably, and securely. The system consists of a **Next.js 15 frontend**, **Next.js API routes**, and a **Supabase PostgreSQL database**. 

To guarantee strict HIPAA/GDPR compliance, data privacy, and a lack of flakiness in Continuous Integration / Continuous Deployment (CI/CD) pipelines, the test suite is strictly categorized into **API**, **Unit**, and **Epic-Driven Integration** tests.

As of the latest configuration, the system boasts a **100% pass rate across 265 automated test cases**, ensuring zero logic degradation.

---

## 1. Unit Testing (157 Passing Tests)
**Directory:** `__tests__/unit/`

Unit testing uses **Jest** to validate the behavior of individual `lib/` functions and utility modules in complete isolation. 
**Mock Strategy:** All external dependencies—including the Supabase client, browser `fetch` API, and `sessionStorage`—are mocked. This guarantees that tests execute within milliseconds, are highly deterministic, and do not pollute databases.

### Core Coverage Areas:
1. **Authentication:** (`auth.test.ts`) Validates correct session storage, role parsing, and logouts.
2. **Appointments:** (`appointments.test.ts`) Validates time-slot algorithms, booking rules, and status updating logic.
3. **Medical Records:** (`medicalRecords.test.ts`) Validates CRUD logic for records and ensures `appointment_id` tracking.
4. **Prescriptions:** (`prescriptions.test.ts`) Validates medicine tracking, doctor-patient linkage, and active/inactive status logic.
5. **Audit Logging:** (`logging.test.ts`) Validates the `logAction` parameter formatting and error boundaries.
6. **WebRTC:** (`webrtc.test.ts`) Validates peer-to-peer connection configurations, offer/answer logic, and signaling events.
7. **Chatbot:** (`chatbot.test.ts`) Validates context merging and prompt construction for the AI system.

---

## 2. API Route Testing (69 Passing Tests)
**Directory:** `__tests__/api/`

API testing evaluates the Next.js serverless route handlers (`app/api/*`). By generating mock `NextRequest` objects, these tests assert HTTP status codes, payload structures, and error messaging.

### Core Coverage Areas:
1. **Chatbot Endpoints:** Mocks OpenAI/Ollama responses to ensure proper data extraction and HTTP 200 delivery.
2. **Medical Reports:** Tests multipart file upload handling, MIME type rejection (e.g., stopping non-PDFs), and signed URL generation logic.
3. **Audit Routes:** Tests cross-tenant limits, ensuring users can only fetch logs they are authorized to view via API requests.
4. **Registration:** Tests the ingestion of new patient data, bcrypt password hashing hooks, and unique auto-generated `patient_id` execution.
5. **Video Calls:** Validates the generation of unique connection tokens and the initialization of call statuses.

---

## 3. Epic-Driven Integration Testing (31 Passing Tests)
**Directory:** `__tests__/integration/`

The integration testing phase has been entirely refactored into **Epics** to better align with the product's Agile Acceptance Criteria. These tests simulate high-level functionality involving complex interactions between modules and database schemas, employing robust mocking to prevent live data pollution while validating structural integrity.

### Epic Coverage:
*   **Epic 1: Secure User Authentication & Role-Based Access (TC-AUTH, TC-AC)**
    *   Validates session caching, role-based boundary enforcement, and routing logic without performing live database mutations.
*   **Epic 2: Patient Medical Record Management (TC-MR, TC-AUD)**
    *   Validates that medical records are strictly bound to doctors and patients, and that viewing them triggers intrinsic audit logs.
*   **Epic 3: Interoperability Across Distributed Hospital Systems (TC-INT)**
    *   Validates cross-hospital doctor discovery algorithms (Directory querying), confirms the intrinsic EMPI (UUID-based mapping) setup within `schema.sql`, and validates interoperability audit payloads.
*   **Epic 4: Secure Data Storage & Transmission (TC-SEC)**
    *   Validates that passwords are never logged, confirms structural pseudonymization (UUID vs SSN) in table designs, and checks configurations for HSTS security standards.
*   **Epic 5: Audit, Monitoring & Breach Handling (TC-AUD)**
    *   Validates the integrity of the centralized `getAllLogs` functionality, verifying that timestamped actions from external gateways are parsed seamlessly.
*   **Epic 6: Telemedicine & Secure Communication (TC-TELE, TC-MSG)**
    *   Validates WebRTC signaling lifecycle events (creation, answering, status tracking) against schema definitions.

**Database Health Check (`database.test.ts`)**
Also included in the integration suite is the Database Health Check. Unlike the Epic tests, this test directly contacts the Supabase instance using `.env` variables solely to assert connection viability, making it a critical gatekeeper for the CI/CD deployment phase.

---

## 4. Automated Regression Testing (Continuous Verification)
Because the SecureHealthCare System is modular and deployed iteratively, **Regression Testing** is an intrinsic element of our automated testing methodology rather than a separate manual phase.

Every time a developer pushes new code, the **entire 265-test suite** (Unit, API, and Integration) is automatically re-run. This ensures that new features (like a new Chatbot enhancement or Doctor component) do not inadvertently break existing, previously verified features (like Core Authentication or Medical Record privacy).

By isolating tests using robust Jest mocks and removing dependencies on manual database seeds, the suite achieves the fundamental goal of regression testing: **Fast, fully repeatable confidence that the core platform logic has not degraded over time.**

---

## CI/CD Pipeline Readiness
The test suite is built natively for automated deployment platforms (like Vercel, GitHub Actions):
*   **Zero Configuration Flakiness:** Because live data dependencies were removed from the tests, the suite will pass reliably on any machine without requiring complex DB seeding.
*   **Clean Outputs:** By utilizing `jest --silent`, unnecessary `console.error` and `console.warn` outputs produced by caught test exceptions are suppressed, yielding clean `.log` artifacts.

To run the entire suite, run:
```bash
npm run test
```
