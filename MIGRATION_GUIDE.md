# Database Migration Instructions

## Problem
The patients table is missing required columns: `phone_number`, `gender`, `emergency_contact`, and `blood_group`.

## Solution
Run the following SQL commands in your Supabase SQL Editor:

### Step 1: Add Missing Columns
```sql
-- Add missing columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT;
```

### Step 2: Verify the Changes
```sql
-- Check the patients table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;
```

## How to Run
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the SQL commands from Step 1
6. Click "Run"
7. Verify with Step 2 query

## Alternative: Drop and Recreate
If you prefer to start fresh, you can drop and recreate the table:

```sql
-- WARNING: This will delete all patient data
DROP TABLE IF EXISTS patients CASCADE;

-- Then run the full schema from /supabase/schema.sql
```
