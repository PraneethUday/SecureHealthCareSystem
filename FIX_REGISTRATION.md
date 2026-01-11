# 🔧 Fix Patient Registration - Add Missing Columns

## Problem

Patient registration is failing with error:

```
Could not find the 'blood_group' column of 'patients' in the schema cache
```

## Solution

You need to add missing columns to the `patients` table in your Supabase database.

## Steps to Fix

### 1. Open Supabase Dashboard

- Go to: https://supabase.com/dashboard
- Login to your account
- Select your project: **SecureHealthCareSystem**

### 2. Open SQL Editor

- Click **"SQL Editor"** in the left sidebar
- Click **"New query"**

### 3. Copy and Run This SQL

```sql
-- Add missing columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- Update existing patients (if any)
UPDATE patients
SET
  phone_number = COALESCE(phone_number, phone),
  gender = COALESCE(gender, 'Not Specified'),
  emergency_contact = COALESCE(emergency_contact, 'Not Provided'),
  blood_group = COALESCE(blood_group, 'Unknown')
WHERE phone_number IS NULL OR gender IS NULL OR emergency_contact IS NULL OR blood_group IS NULL;

-- Drop old columns
ALTER TABLE patients DROP COLUMN IF EXISTS phone;
ALTER TABLE patients DROP COLUMN IF EXISTS city;
ALTER TABLE patients DROP COLUMN IF EXISTS state;
ALTER TABLE patients DROP COLUMN IF EXISTS zip_code;
```

### 4. Click "Run" Button

### 5. Verify Success

Run this query to check the columns:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;
```

You should see these columns:

- ✅ phone_number
- ✅ gender
- ✅ emergency_contact
- ✅ blood_group

### 6. Test Patient Registration

- Go to: http://localhost:3000/register/patient
- Fill out the registration form
- Click "Create Account"
- Should successfully create patient!

## What Changed

**Old columns (removed):**

- `phone` → now `phone_number`
- `city`, `state`, `zip_code` → removed (address is combined)

**New columns (added):**

- `phone_number` - Patient phone number
- `gender` - Male/Female/Other
- `emergency_contact` - Emergency contact phone
- `blood_group` - A+, A-, B+, B-, AB+, AB-, O+, O-

## Need Help?

If you get any errors, share the error message!
