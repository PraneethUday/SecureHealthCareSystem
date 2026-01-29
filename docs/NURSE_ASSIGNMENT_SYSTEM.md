# Nurse Assignment System Setup Guide

## Overview
This system automatically assigns nurses to patient appointments and allows doctors to change nurse assignments when needed.

## Features
1. **Automatic Nurse Assignment**: When a patient books an appointment, a nurse from the same department is automatically assigned
2. **Nurse Dashboard - Patient Care**: Nurses can view all patients assigned to them with detailed appointment information
3. **Doctor Dashboard - Nurse Management**: Doctors can change the assigned nurse for any appointment

## Database Setup

### Step 1: Run the Nurse Assignment Schema

Run this SQL script in your Supabase SQL Editor:

```bash
cat supabase/add-nurse-assignment.sql
```

This will:
- ✅ Add `nurse_id` column to the appointments table
- ✅ Create auto-assignment trigger (assigns nurse with fewest current appointments)
- ✅ Add RLS policies for nurses to view their assigned appointments

### Step 2: Verify the Setup

Check that the changes were applied:

```sql
-- Verify nurse_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'nurse_id';

-- Verify trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_assign_nurse_trigger';
```

## How It Works

### Automatic Assignment Logic

When a patient books an appointment:
1. System gets the doctor's department (e.g., "Cardiology")
2. Finds all nurses in that department
3. Counts current scheduled appointments for each nurse on that date
4. Assigns the nurse with the fewest appointments (load balancing)

**Example:**
- Patient books appointment with Dr. Smith (Cardiology)
- System finds 3 nurses in Cardiology: N001, N002, N003
- N001 has 5 appointments today, N002 has 3, N003 has 4
- N002 is automatically assigned (fewest appointments)

### Nurse Dashboard

**Location**: `/dashboard/nurse` → Click "Patient Care" card

**Features**:
- View all assigned patients
- Filter by: Today / Upcoming / All
- Patient information: Name, Age, Contact details
- Appointment details: Date, Time, Doctor, Hospital
- Reason for visit

**What Nurses See**:
```
┌─────────────────────────────────────┐
│ John Doe                            │
│ ID: P001 • Age: 45                  │
│ Status: scheduled                   │
├─────────────────────────────────────┤
│ 📅 Wed, Jan 15, 2026                │
│ 🕐 10:30 AM                          │
│ 👨‍⚕️ Dr. Sarah Johnson (Cardiology)  │
│ 📍 Apollo Hospitals                  │
│                                     │
│ Reason: Chest pain and shortness   │
│ of breath                           │
│                                     │
│ 📞 555-0123  ✉️ john@email.com     │
└─────────────────────────────────────┘
```

### Doctor Dashboard

**Location**: `/dashboard/doctor` → View appointment cards

**Nurse Assignment Control**:
- Each appointment shows "Assigned Nurse: [Name]"
- Click the nurse name to open selector dropdown
- Choose a different nurse from the same department
- Changes are immediate

**What Doctors See**:
```
Appointment Card:
┌─────────────────────────────────────┐
│ 📍 Apollo Hospitals                  │
│ 👤 Assigned Nurse: Sarah Thompson   │  ← Click to change
│                      ↓
│     ┌───────────────────────┐
│     │ Select Nurse          │
│     │ Cardiology Department │
│     ├───────────────────────┤
│     │ ✓ Sarah Thompson (N001)│
│     │   Mike Johnson (N002)  │
│     │   Lisa Chen (N003)     │
│     └───────────────────────┘
└─────────────────────────────────────┘
```

## Usage Examples

### For Patients
No action needed - nurse is automatically assigned when booking appointment.

### For Nurses
1. Login to nurse dashboard
2. Click "Patient Care" card on overview
3. View today's assigned patients by default
4. Use filters to see upcoming or all appointments
5. Contact patients as needed for pre-appointment instructions

### For Doctors
1. Login to doctor dashboard
2. View appointment list
3. Each card shows assigned nurse
4. To change nurse:
   - Click on nurse name
   - Select different nurse from dropdown
   - Assignment updates immediately
5. Nurse can see updated assignment in their dashboard

## Testing the System

### Test 1: Verify Auto-Assignment

```sql
-- Check if new appointments have nurses assigned
SELECT 
  a.id,
  a.appointment_date,
  p.patient_id,
  d.doctor_id,
  d.department,
  n.nurse_id,
  n.first_name || ' ' || n.last_name as nurse_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN nurses n ON a.nurse_id = n.id
WHERE a.created_at > NOW() - INTERVAL '1 hour'
ORDER BY a.created_at DESC;
```

### Test 2: Check Load Balancing

```sql
-- See appointment distribution among nurses
SELECT 
  n.nurse_id,
  n.first_name || ' ' || n.last_name as nurse_name,
  n.department,
  COUNT(a.id) as appointment_count
FROM nurses n
LEFT JOIN appointments a ON a.nurse_id = n.id 
  AND a.appointment_date >= CURRENT_DATE
  AND a.status = 'scheduled'
GROUP BY n.id, n.nurse_id, n.first_name, n.last_name, n.department
ORDER BY n.department, appointment_count;
```

### Test 3: Nurse Dashboard Data

```sql
-- Get appointments for a specific nurse
SELECT 
  a.appointment_date,
  a.appointment_time,
  p.patient_id,
  p.first_name || ' ' || p.last_name as patient_name,
  d.first_name || ' ' || d.last_name as doctor_name,
  h.name as hospital_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN hospitals h ON a.hospital_id = h.id
JOIN nurses n ON a.nurse_id = n.id
WHERE n.nurse_id = 'N001'  -- Replace with actual nurse ID
  AND a.status = 'scheduled'
ORDER BY a.appointment_date, a.appointment_time;
```

## Troubleshooting

### Issue: Nurse not auto-assigned
**Cause**: No nurses available in the doctor's department  
**Solution**: 
1. Check doctor's department matches nurse department
2. Add nurses to the required department
3. Verify trigger is active

### Issue: Nurse can't see assigned patients
**Cause**: RLS policies not properly configured  
**Solution**: Re-run the `add-nurse-assignment.sql` script

### Issue: Doctor can't change nurse assignment
**Cause**: Permission or department mismatch  
**Solution**: 
1. Verify nurse is in the same department as doctor
2. Check browser console for errors
3. Verify Supabase connection

## File Structure

```
app/
  dashboard/
    nurse/
      components/
        PatientCare.tsx          # Nurse's patient list view
      page.tsx                   # Updated with Patient Care
    doctor/
      components/
        NurseAssignment.tsx      # Nurse selector for doctors
        DoctorAppointmentCard.tsx # Updated with nurse info
lib/
  appointments.ts                # Updated to fetch nurse data
  database.types.ts              # Updated with nurse fields
supabase/
  add-nurse-assignment.sql       # Database migration script
```

## API Endpoints Used

- `GET /api/appointments` - Fetch appointments with nurse info
- `PATCH /api/appointments/{id}` - Update nurse assignment (via Supabase client)

## Future Enhancements

1. **Nurse Preferences**: Allow nurses to set preferred shifts/times
2. **Skill Matching**: Assign nurses based on specialization or certifications
3. **Notifications**: Alert nurses when assigned to new patients
4. **Workload Analytics**: Dashboard showing nurse workload distribution
5. **Shift Management**: Respect nurse shift schedules in auto-assignment

---

**Status**: ✅ Ready for Production  
**Version**: 1.0  
**Last Updated**: January 12, 2026
