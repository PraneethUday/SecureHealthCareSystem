# Database Setup Guide

## ✅ Recommended: Single File Setup (Easiest)

**For new Supabase projects or fresh database setup:**

Run this single file in your Supabase SQL Editor:

```
complete-setup.sql
```

This all-in-one file includes:
- ✅ All base tables (admins, patients, doctors, nurses, staff)
- ✅ Authentication tables (otp_logs, login_audit, password_history)
- ✅ Appointments system with Tamil Nadu hospitals
- ✅ Medical records and prescriptions
- ✅ Medical reports upload system
- ✅ Chat system (conversations, messages, attachments)
- ✅ Video calls (WebRTC signaling)
- ✅ All required columns (blockchain_verified, password_hash, etc.)
- ✅ RLS policies and triggers
- ✅ Realtime enabled for chat and video calls
- ✅ Hospital seed data

**That's it! Your database is ready to use.** 🎉

---

## 🔧 Alternative: Modular Setup (Advanced)

If you prefer to run individual schema files in order:

### 1. Base Schema
```
schema.sql
```
Creates all base tables: admins, patients, doctors, nurses, staff, access_logs

### 2. Appointments System
```
appointments-schema.sql
```
Creates Tamil Nadu hospitals, appointments table, and related functionality

### 3. Medical Records System
```
fix-medical-records-rls.sql
```
Creates medical_records table with proper structure and RLS policies

### 4. Telemedicine & Prescriptions
```
telemedicine-schema.sql
```
Adds video call support to appointments and creates prescriptions system

### 5. WebRTC Video Calls
```
webrtc-schema.sql
```
Creates video_calls and signaling tables for peer-to-peer video calls

### 6. Medical Reports Upload
```
medical-reports-schema.sql
```
Creates medical_reports and medical_report_logs tables

### 7. Authentication & MFA
```
auth-mfa-schema.sql
```
Creates otp_logs, login_audit, and password_history tables

### 8. Enable Realtime
```
enable-realtime.sql
```
Enables realtime features for video calls and chat

### 9. Seed Data
```
seed.sql
```
Inserts sample users (admin, patients, doctors, nurses, staff)

---

## 🔑 Login Credentials (After Setup)

### Admin
- Username: `admin`
- Password: `admin`

### Patients
- P001 / patient1
- P002 / patient2
- P003 / patient3

### Doctors (Tamil Names)
- D001 / doctor1 (Dr. Rajesh Kumar - Cardiology)
- D002 / doctor2 (Dr. Priya Selvam - Pediatrics)
- D003 / doctor3 (Dr. Lakshmi Narayanan - Neurology)

### Nurses
- N001 / nurse1
- N002 / nurse2
- N003 / nurse3

### Staff
- S001 / staff1
- S002 / staff2
- S003 / staff3

---

## 🏥 Tamil Nadu Hospitals (10 Total)

1. Apollo Hospitals (Chennai)
2. Fortis Malar Hospital (Chennai)
3. KMCH Hospital (Coimbatore)
4. PSG Hospitals (Coimbatore)
5. Kauvery Hospital (Tiruchirappalli)
6. Velammal Medical College Hospital (Madurai)
7. Vijaya Hospital (Chennai)
8. GEM Hospital (Coimbatore)
9. Rela Hospital (Chennai)
10. MIOT International (Chennai)

---

## 📝 Notes

- **Use `complete-setup.sql` for the simplest setup** - it's a single file with everything
- The modular approach is only needed if you want to customize individual components
- All files use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` to prevent errors on re-runs
- RLS (Row Level Security) is enabled with permissive policies - app handles authorization
