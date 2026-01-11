# Enable Supabase Realtime for Video Call Notifications

## Problem
Doctor dashboard is not receiving real-time notifications when patients initiate video calls.

## Root Cause
Supabase Realtime is not enabled for the `video_calls` table in your Supabase project.

## Solution

### Option 1: Enable via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Find the `video_calls` table
4. Click on it and toggle **Enable Realtime** to ON
5. Also enable Realtime for `video_call_signaling` table
6. Wait a few seconds for changes to apply

### Option 2: Run SQL Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase/enable-realtime.sql`
4. Click **Run** to execute the migration

### Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Push the migration to your Supabase project
supabase db push
```

Or manually run the SQL file:

```bash
# Connect to your database and run the migration
psql YOUR_DATABASE_URL < supabase/enable-realtime.sql
```

## Verify It's Working

After enabling Realtime:

1. **Open Browser Console** (F12) on doctor dashboard
2. Look for log: `[WebRTC] ✅ Successfully subscribed to incoming calls for doctor: [doctor-id]`
3. **Test the flow**:
   - Patient clicks "Start Video Call"
   - Check console for: `[WebRTC] ✅ Video call created successfully`
   - Doctor dashboard should show: `[WebRTC] 🔔 Incoming call received`
   - Modal should appear with "Incoming Video Call" notification

## Debugging

If still not working, check browser console for:

- **Doctor Dashboard**: Should see subscription confirmation
- **Patient Dashboard**: Should see call creation with correct doctor_id
- **Network Tab**: Check for Supabase Realtime websocket connection

### Expected Console Output

**Doctor Dashboard:**
```
[WebRTC] Subscribing to incoming calls for doctor: [uuid]
[WebRTC] Subscription status for doctor [uuid]: SUBSCRIBED
[WebRTC] ✅ Successfully subscribed to incoming calls for doctor: [uuid]
```

**Patient Call Initiation:**
```
[WebRTC] Creating video call with: { appointment_id, patient_id, doctor_id, status: 'calling' }
[WebRTC] ✅ Video call created successfully: { id, doctor_id, status: 'calling' }
```

**Doctor Receives Notification:**
```
[WebRTC] INSERT event received for video_calls table
[WebRTC] 🔔 Incoming call received: [call-id]
[IncomingCallModal] New incoming call: [call-id]
```

## Alternative: Check Realtime Status via SQL

Run this query in your Supabase SQL Editor to check if Realtime is enabled:

```sql
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime';
```

You should see `video_calls` and `video_call_signaling` in the results.
