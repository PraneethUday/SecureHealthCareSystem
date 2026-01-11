# Quick Setup Guide

## Step 1: Create Tables in Supabase

1. Open your Supabase dashboard: https://app.supabase.com/project/lkgzfyrrkkchmlivrdec
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: "Success. No rows returned"

## Step 2: Insert Sample Data

1. In the same SQL Editor, clear the previous query
2. Copy the entire contents of `supabase/seed.sql`
3. Paste into the SQL Editor
4. Click **Run**

You should see success messages for each insert.

## Alternative: Use the Automated Script

If you prefer, you can try the automated script:

```bash
npm run setup-db
```

**Note:** This may require additional permissions. If it fails, use the manual method above.

## Verify Setup

After running the setup:

1. Go to **Table Editor** in Supabase
2. You should see these tables:

   - admins
   - patients
   - doctors
   - nurses
   - staff
   - medical_records
   - access_logs

3. Click on each table to verify the sample data was inserted

## Test Login Credentials

**New Simple Passwords:**

- Admin: `admin` / `admin123`
- Patient: `john.doe@email.com` / `patient1` (use EMAIL)
- Doctor: `D001` / `doctor1`
- Nurse: `N001` / `nurse1`
- Staff: `S001` / `staff1`

## Troubleshooting

If you get permission errors:

- Make sure you're logged into the correct Supabase project
- Use the manual SQL Editor method instead of the script
- Check that Row Level Security (RLS) is disabled for testing (can enable later)
