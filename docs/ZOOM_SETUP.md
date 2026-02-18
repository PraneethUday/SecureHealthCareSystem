# Zoom Integration Setup Guide

## 🎯 Overview

We've replaced the complex custom WebRTC system with Zoom's reliable, HIPAA-compliant video calling. This guide will help you set up Zoom integration in about 15 minutes.

## ✅ What's Been Done

1. ✅ Created Zoom API integration library (`lib/zoom.ts`)
2. ✅ Updated appointments to automatically create Zoom meetings
3. ✅ Added Zoom fields to database schema
4. ✅ Configured HIPAA-compliant settings (waiting room, encryption, recording)
5. ✅ Added environment variables for Zoom credentials

## 🚀 Setup Steps

### Step 1: Create Zoom Account (5 minutes)

1. Go to [https://marketplace.zoom.us/](https://marketplace.zoom.us/)
2. Click "Develop" → "Build App"
3. Choose "Server-to-Server OAuth"
4. Fill in app details:
   - App Name: `SecureHealthCare Telemedicine`
   - Company Name: Your company name
   - Developer Contact: Your email

### Step 2: Get API Credentials (2 minutes)

After creating the app, you'll see:
- **Account ID**
- **Client ID**
- **Client Secret**

Copy these values!

### Step 3: Add Scopes (2 minutes)

In your Zoom app settings, go to the "Scopes" tab and add these scopes:

**Required Scopes:**
- ✅ `meeting:write:admin` - Create meetings
- ✅ `meeting:update:admin` - Update meetings  
- ✅ `meeting:delete:admin` - Delete meetings

**Optional (but recommended):**
- ✅ `user:read:admin` - Read user info (if available)
- ✅ `recording:write:admin` - Manage recordings

**Note:** If you don't see `meeting:read:admin` or `user:read:admin`, that's okay! The main scope you need is `meeting:write:admin`. The system will work fine with just that.

Click "Continue" and then click "Activate" to activate your app.

### Step 4: Configure Environment Variables (1 minute)

Add to your `.env` file:

```bash
# Zoom Configuration
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
```

### Step 5: Run Database Migration (2 minutes)

Run this SQL in Supabase SQL Editor:

```sql
-- Add Zoom fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_host_url TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_password TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zoom_created_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_appointments_zoom_meeting ON appointments(zoom_meeting_id);
```

Or run the migration file:
```bash
# Copy the SQL from supabase/migrations/add_zoom_fields.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

### Step 6: Install Dependencies (1 minute)

```bash
npm install @zoom/meetingsdk axios
```

### Step 7: Test It! (2 minutes)

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Create a telemedicine appointment**:
   - Go to patient dashboard
   - Book an appointment
   - Check "Telemedicine" option
   - Submit

3. **Check the console** - you should see:
   ```
   [Appointments] Creating Zoom meeting for telemedicine appointment...
   [Zoom] ✅ Meeting created successfully: 123456789
   [Appointments] ✅ Zoom meeting created and linked to appointment
   ```

4. **Check the database** - the appointment should have:
   - `zoom_meeting_id`
   - `zoom_join_url`
   - `zoom_host_url`

## 📊 How It Works

### When Patient Books Telemedicine Appointment:

```
1. Patient fills appointment form
2. Selects "Telemedicine" option
3. Clicks "Book Appointment"
   ↓
4. System creates appointment in database
5. System calls Zoom API to create meeting
6. Zoom returns meeting URLs:
   - Host URL (for doctor)
   - Join URL (for patient)
7. System saves URLs to appointment
   ↓
8. ✅ Done! Both users can now join the call
```

### Zoom Meeting Settings (HIPAA Compliant):

- ✅ **Waiting Room**: Enabled (patient waits for doctor)
- ✅ **Encryption**: Enhanced encryption
- ✅ **Recording**: Cloud recording enabled
- ✅ **Join Before Host**: Disabled (doctor must join first)
- ✅ **Password**: Auto-generated
- ✅ **Duration**: Matches appointment duration

## 🎨 Next Steps: Update UI

### Add "Join Video Call" Buttons

**For Doctor Dashboard:**
```typescript
{appointment.zoom_host_url && (
  <a
    href={appointment.zoom_host_url}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-primary"
  >
    🎥 Start Video Call
  </a>
)}
```

**For Patient Dashboard:**
```typescript
{appointment.zoom_join_url && (
  <a
    href={appointment.zoom_join_url}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-primary"
  >
    🎥 Join Video Call
  </a>
)}
```

## 💰 Pricing

### Zoom Plans:
- **Basic**: Free (40-minute limit) - Good for testing
- **Pro**: $15.99/month - Unlimited duration ✅ **Recommended**
- **Business**: $19.99/month - More features

For healthcare, get **Zoom Pro** or higher.

## 🔒 HIPAA Compliance

Zoom is HIPAA compliant when you:
1. ✅ Sign a Business Associate Agreement (BAA) with Zoom
2. ✅ Use Zoom Healthcare plan or higher
3. ✅ Enable waiting room (we did this)
4. ✅ Enable encryption (we did this)
5. ✅ Enable cloud recording (we did this)

**To get BAA:**
- Email Zoom support: hipaa@zoom.us
- Request HIPAA compliance and BAA
- They'll send you the agreement

## 🐛 Troubleshooting

### "Failed to authenticate with Zoom"
- Check your `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`
- Make sure they're in `.env` file
- Restart your dev server

### "Zoom not configured"
- Check if environment variables are set
- The system will skip Zoom creation but appointment will still be created

### "Error creating Zoom meeting"
- Check Zoom app scopes (need `meeting:write:admin`)
- Check if Zoom app is activated
- Check console for detailed error

## 📝 Files Modified

1. ✅ `lib/zoom.ts` - Zoom API integration
2. ✅ `lib/appointments.ts` - Auto-create Zoom meetings
3. ✅ `supabase/migrations/add_zoom_fields.sql` - Database migration
4. ✅ `.env.example` - Added Zoom variables

## 🎯 Benefits Over Custom WebRTC

| Feature | Custom WebRTC | Zoom Integration |
|---------|---------------|------------------|
| **Setup Time** | Weeks | 15 minutes |
| **Reliability** | ⚠️ Complex | ✅ 99.9% uptime |
| **HIPAA Compliance** | ❌ Need custom BAA | ✅ Built-in |
| **Features** | Basic | Professional |
| **Debugging** | Hours | Minutes |
| **User Experience** | Unknown | Familiar |
| **Cost** | $0 (your time) | $16/month |

## 🚀 Ready to Go!

Once you complete the setup steps above, your telemedicine appointments will automatically get Zoom links! No more WebRTC debugging! 🎉

## Support

If you need help:
1. Check the Zoom API docs: https://developers.zoom.us/docs/api/
2. Check Zoom status: https://status.zoom.us/
3. Contact Zoom support: https://support.zoom.us/
