# Database Setup - Correct Order

Run these SQL files in your Supabase SQL Editor in this exact order:

## 1. Base Schema

```
schema.sql
```

Creates all base tables: admins, patients, doctors, nurses, staff, access_logs

## 2. Appointments System

```
appointments-schema.sql
```

Creates Tamil Nadu hospitals, appointments table, and related functionality

## 3. Medical Records System

```
fix-medical-records-rls.sql
```

Creates medical_records table with proper structure and RLS policies

## 4. Telemedicine & Prescriptions

```
telemedicine-schema.sql
```

Adds video call support to appointments and creates prescriptions system

## 5. WebRTC Video Calls

```
webrtc-schema.sql
```

Creates video_calls and signaling tables for peer-to-peer video calls

## 6. Enable Realtime

```
enable-realtime.sql
```

Enables realtime features for video call notifications

## 7. Seed Data

```
seed.sql
```

Inserts sample users (admin, patients, doctors, nurses, staff)

---

## Login Credentials (After Seeding)

**Admin:**

- Username: `admin`
- Password: `admin`

**Patients:**

- P001 / patient1
- P002 / patient2
- P003 / patient3

**Doctors (Tamil Names):**

- D001 / doctor1 (Dr. Rajesh Kumar - Cardiology)
- D002 / doctor2 (Dr. Priya Selvam - Pediatrics)
- D003 / doctor3 (Dr. Lakshmi Narayanan - Neurology)

**Nurses:**

- N001 / nurse1
- N002 / nurse2
- N003 / nurse3

**Staff:**

- S001 / staff1
- S002 / staff2
- S003 / staff3

## Tamil Nadu Hospitals (10 Total)

1. Apollo Hospitals (Chennai)
2. Fortis Malar Hospital (Chennai)
3. Kovai Medical Center and Hospital (Coimbatore)
4. PSG Hospitals (Coimbatore)
5. Kauvery Hospital (Chennai)
6. Velammal Medical College Hospital (Madurai)
7. Vijaya Hospital (Chennai)
8. GEM Hospital (Coimbatore)
9. Rela Hospital (Chennai)
10. MIOT International (Chennai)
