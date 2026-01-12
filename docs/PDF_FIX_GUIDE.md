# Medical Reports PDF Fix Guide

## Issues Fixed

### 1. WebRTC Channel Errors
**Problem:** CHANNEL_ERROR flooding the console  
**Solution:** Updated error handling to treat channel errors as warnings instead of fatal errors

**Changes Made:**
- Modified `/lib/webrtc-signaling.ts` to add better logging and error handling
- Channel errors are now logged as warnings (since realtime may not be enabled)
- Added emojis for better log readability

### 2. PDF Viewing/Downloading Not Working
**Problem:** Files uploaded to private storage bucket but not accessible  
**Solution:** Implemented signed URL generation for secure file access

**Changes Made:**
- Updated `/app/api/medical-reports/route.ts` GET endpoint to generate signed URLs (1 hour expiry)
- Created `/app/api/medical-reports/download/route.ts` for dedicated download URLs (5 min expiry)
- Updated `/app/dashboard/doctor/components/MedicalReportsViewer.tsx` to use signed URLs

## Setup Required

### Step 1: Create Storage Bucket in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"Create a new bucket"**
5. Configure the bucket:
   - **Name:** `medical-reports`
   - **Public:** ❌ **NO** (keep it private for security)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** (leave empty for all types, or add: `application/pdf`, `image/jpeg`, `image/png`, `application/dicom`)
6. Click **"Create bucket"**

### Step 2: Run Database Schema

Run the medical reports schema in Supabase SQL Editor:

```bash
# From your project root
cat supabase/medical-reports-schema.sql | pbcopy
```

Then:
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Paste the schema
4. Click **"Run"**

This will create:
- ✅ `medical_reports` table
- ✅ `medical_report_logs` table (audit trail)
- ✅ Storage policies for upload/read/delete
- ✅ Automatic logging triggers

### Step 3: Verify Storage Policies

The schema automatically creates these policies:
- `Allow authenticated uploads to medical-reports` - For uploading files
- `Allow authenticated reads from medical-reports` - For viewing/downloading files
- `Allow authenticated deletes from medical-reports` - For deleting files

You can verify these in **Storage > Policies** in the Supabase Dashboard.

### Step 4: Test the System

#### Upload a Report (Nurse Dashboard)
1. Login as a nurse
2. Go to **Medical Reports** tab
3. Enter patient ID (e.g., `P001`)
4. Select report type (e.g., `blood_test`)
5. Upload a PDF file
6. Submit

#### View/Download Report (Doctor Dashboard)
1. Login as a doctor
2. Go to **Medical Reports** tab
3. Search for patient ID (e.g., `P001`)
4. Click **"View"** to open in new tab
5. Click **"Download"** to download the file

## How It Works

### Signed URLs for Security

Files are stored in a **private bucket** for security. To access them:

1. **Upload:** File is uploaded to storage bucket, URL is stored in database
2. **Fetch:** When doctor requests reports, API generates signed URLs (valid for 1 hour)
3. **View/Download:** Signed URLs allow temporary access without making files public

### Signed URL Expiry
- **View/List:** 1 hour (3600 seconds)
- **Download:** 5 minutes (300 seconds)

This ensures files remain private but accessible to authorized users.

## Troubleshooting

### "Failed to upload file"
- ✅ Verify storage bucket `medical-reports` exists
- ✅ Check bucket is set to **private** (not public)
- ✅ Verify storage policies are created
- ✅ Check file size is under 50MB

### "Failed to generate download link"
- ✅ Verify file exists in storage bucket
- ✅ Check storage policies allow reads
- ✅ Verify file path matches database record

### WebRTC Channel Errors
- ⚠️ These are warnings, not fatal errors
- ⚠️ Video calling will still work with polling as fallback
- ✅ To enable realtime, enable **Realtime** for `video_call_signaling` table in Supabase Dashboard

### Files Upload Successfully but Can't Be Viewed
- ✅ Check signed URL generation is working (check browser console)
- ✅ Verify API endpoint returns signed URLs (not public URLs)
- ✅ Make sure bucket is **private** (public buckets don't need signed URLs)

## File Structure

```
app/
  api/
    medical-reports/
      route.ts              # Upload & fetch with signed URLs
      log-view/
        route.ts            # Audit logging
      download/
        route.ts            # Download endpoint (NEW)
  dashboard/
    doctor/
      components/
        MedicalReportsViewer.tsx  # Updated to use signed URLs
    nurse/
      components/
        MedicalReportUpload.tsx   # Upload form

lib/
  webrtc-signaling.ts      # Updated error handling

supabase/
  medical-reports-schema.sql  # Database schema with storage policies
```

## Security Features

1. **Private Storage:** Files not publicly accessible
2. **Signed URLs:** Temporary access with expiration
3. **RLS Policies:** Database-level access control
4. **Audit Logging:** Track all uploads, views, downloads
5. **Role-Based Access:** Nurses upload, doctors view

## Next Steps

1. ✅ Create storage bucket in Supabase Dashboard
2. ✅ Run database schema in SQL Editor
3. ✅ Test upload as nurse
4. ✅ Test view/download as doctor
5. ✅ Monitor audit logs in `medical_report_logs` table

---

**Need Help?**
- Check Supabase Dashboard Storage section
- Verify storage policies are active
- Check browser console for errors
- Review database logs in `medical_report_logs` table
