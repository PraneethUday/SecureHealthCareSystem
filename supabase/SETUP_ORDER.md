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

## 3. Doctor-Hospital Associations

```
doctor-hospitals-schema.sql
```

Creates doctor_hospitals junction table to link doctors to specific hospitals

## 4. Medical Records System

```
fix-medical-records-rls.sql
```

Creates medical_records table with proper structure and RLS policies

## 5. Telemedicine & Prescriptions

```
telemedicine-schema.sql
```

Adds video call support to appointments and creates prescriptions system

## 6. WebRTC Video Calls

```
webrtc-schema.sql
```

Creates video_calls and signaling tables for peer-to-peer video calls

## 7. Enable Realtime

```
enable-realtime.sql
```

Enables realtime features for video call notifications

## 8. Seed Data

```
seed.sql
```

Inserts sample users (admin, patients, doctors, nurses, staff) and doctor-hospital associations

---

## Login Credentials (After Seeding)

**Admin:**

- Username: `admin`
- Password: `admin`

**Patients (Indian Names):**

- P001 / patient1 (Arun Krishnamurthy)
- P002 / patient2 (Meera Sundaram)
- P003 / patient3 (Venkatesh Raghavan)

**Doctors (Tamil Names - 30 doctors across 10 hospitals):**

- D001 / doctor1 (Dr. Rajesh Krishnamoorthy - Cardiology, Apollo Chennai)
- D004 / doctor4 (Dr. Lakshmi Subramanian - Orthopedics, Fortis Chennai)
- D007 / doctor7 (Dr. Murugan Palaniswamy - Cardiology, KMCH Coimbatore)
- D010 / doctor10 (Dr. Ramya Krishnan - General Medicine, PSG Coimbatore)
- D013 / doctor13 (Dr. Senthil Arumugam - Cardiology, Kauvery Trichy)
- ... and 25 more doctors

**Nurses (Indian Names):**

- N001 / nurse1 (Malathi Venkatesh)
- N002 / nurse2 (Sudha Ramasamy)
- N003 / nurse3 (Kanchana Murugesan)

**Staff (Indian Names):**

- S001 / staff1 (Kumaran Swaminathan)
- S002 / staff2 (Jayalakshmi Balasubramanian)
- S003 / staff3 (Ravi Pandian)

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
