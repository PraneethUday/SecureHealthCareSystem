# Database Setup Guide

## 🔄 Restored from a pg_dump backup? Read this first

If you created a new Supabase project and restored a `db_cluster-*.backup.gz`
dump into it, the dump only contains schema/data as of the moment it was
taken. Any schema file in this folder with a later date was applied to the
*old* project by hand afterward and is **not** in that dump. Restoring an
older backup into a new project silently drops those tables/columns/
functions, which surfaces as PostgREST errors like:

```
Could not find the function public.is_account_locked(...)
Could not find the 'details' column of 'access_logs'
Could not find the 'password_changed_at' column of 'patients'
```

Run `post-restore-sync.sql` once in the Supabase SQL Editor to bring a
restored database back up to what the current app code expects (MFA/OTP,
account lockout, chat, vitals, notifications, doctor/nurse/staff hospital
links, security monitoring, password reset fields). See the file's header
for exactly what it does and does not include.

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

### 3. Doctor-Hospital Associations
```
doctor-hospitals-schema.sql
```
Creates doctor_hospitals junction table to link doctors to specific hospitals

### 4. Medical Records System
```
fix-medical-records-rls.sql
```
Creates medical_records table with proper structure and RLS policies

### 5. Telemedicine & Prescriptions
```
telemedicine-schema.sql
```
Adds video call support to appointments and creates prescriptions system

### 6. WebRTC Video Calls
```
webrtc-schema.sql
```
Creates video_calls and signaling tables for peer-to-peer video calls

### 7. Medical Reports Upload
```
medical-reports-schema.sql
```
Creates medical_reports and medical_report_logs tables

### 8. Authentication & MFA
```
auth-mfa-schema.sql
```
Creates otp_logs, login_audit, and password_history tables

### 9. Enable Realtime
```
enable-realtime.sql
```
Enables realtime features for video calls and chat

### 10. Seed Data
```
seed.sql
```
Inserts sample users (admin, patients, doctors, nurses, staff) and doctor-hospital associations

---

## 🔑 Login Credentials (After Setup)

### Admin
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
