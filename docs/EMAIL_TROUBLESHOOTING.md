# 🔍 Email Not Working - Troubleshooting Guide

## Problem: Not receiving emails when booking appointments

---

## ✅ Quick Diagnostic Checklist

### 1. **Check Browser Console** (F12)

When you book an appointment, look for these logs:

**✅ Good (Working):**
```
[Appointments] Sending email notifications...
✅ Patient confirmation email sent
✅ Doctor notification email sent
```

**❌ Bad (Not Working):**
```
[Appointments] Error sending email notifications: [error details]
```

---

### 2. **Check Server Terminal** (where `npm run dev` is running)

You should see:
```
POST /api/email/send 200
[API] Sending email notification: appointment_confirmation
[API] ✅ Patient confirmation email sent
```

**If you DON'T see these**, the API route isn't being called.

---

### 3. **Check Network Tab** (F12 → Network)

1. Open DevTools (F12)
2. Go to "Network" tab
3. Book an appointment
4. Look for requests to `/api/email/send`

**What to check:**
- Status Code: Should be `200 OK`
- Response: Should be `{"success": true}`

**If Status is 500 or error:**
- Click on the request
- Check "Response" tab for error details

---

## 🔧 Common Issues & Fixes

### Issue 1: Gmail App Password Invalid

**Symptom:** Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Fix:**
1. Go to Google Account: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already)
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Create new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Update `.env`:
   ```
   EMAIL_PASSWORD=your-new-app-password
   ```
7. Restart dev server

---

### Issue 2: Email Service Not Configured

**Symptom:** No error, but no email sent

**Fix:**
Check `.env` has all required fields:
```bash
EMAIL_USER=securehealthcare4@gmail.com
EMAIL_PASSWORD=vlkevljyigwuzxma
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**Restart dev server after changing `.env`**

---

### Issue 3: API Route Not Being Called

**Symptom:** No logs in server console

**Possible Causes:**
1. **Appointment creation failed** - Check for errors before email step
2. **Patient/Doctor data missing** - Email needs patient and doctor info

**Fix:**
Check browser console for errors during appointment creation.

---

### Issue 4: Emails Going to Spam

**Symptom:** No email in inbox

**Fix:**
1. Check **Spam/Junk** folder
2. Check **All Mail** folder in Gmail
3. Search for "SecureHealthCare" in Gmail

---

## 🧪 Manual Test

### Test 1: Direct Email Test

Run this command to test email service directly:

```bash
npx tsx scripts/test-email.ts
```

**Expected output:**
```
🧪 Testing Email Service...
📋 Environment Variables:
EMAIL_USER: securehealthcare4@gmail.com
EMAIL_PASSWORD: ✅ Set
📧 Sending test email...
✅ Email sent successfully!
📬 Check inbox: securehealthcare4@gmail.com
```

**If this works but appointment emails don't:**
- Problem is in the API route or appointment flow
- Check browser/server console logs

**If this doesn't work:**
- Problem is with email configuration
- Check Gmail App Password

---

### Test 2: Check Patient Email in Database

The email is sent to the patient's registered email address.

**Check what email is registered:**

1. Go to Supabase dashboard
2. Open `patients` table
3. Find your patient record
4. Check the `email` field

**Make sure:**
- Email is correct
- You have access to that email inbox
- Email is not a test/fake email

---

## 📝 Step-by-Step Debugging

### Step 1: Book an Appointment

1. Login as patient
2. Book a new appointment (use a different time slot to avoid duplicate error)
3. Keep browser console (F12) open

### Step 2: Check Browser Console

Look for:
```
[Appointments] Sending email notifications...
```

**If you see this:**
- ✅ Email code is running
- Check if you see "✅ Patient confirmation email sent"

**If you DON'T see this:**
- ❌ Email code not reached
- Check for errors earlier in appointment creation

### Step 3: Check Server Console

Look for:
```
POST /api/email/send 200
[API] ✅ Patient confirmation email sent
```

**If you see this:**
- ✅ API route is working
- ✅ Email was sent
- Check your email inbox (including spam)

**If you DON'T see this:**
- ❌ API route not called or failed
- Check Network tab for `/api/email/send` request

### Step 4: Check Email Inbox

1. Check inbox of the patient's registered email
2. Check spam/junk folder
3. Search for "SecureHealthCare" or "Appointment Confirmed"

---

## 🎯 Quick Fixes to Try

### Fix 1: Restart Dev Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### Fix 2: Clear Browser Cache
1. Press F12
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check Patient Email
Make sure you're checking the correct email inbox (the one registered in the patient profile).

### Fix 4: Regenerate Gmail App Password
1. Delete old app password
2. Create new one
3. Update `.env`
4. Restart server

---

## 📊 What to Share for Help

If still not working, share these details:

1. **Browser Console Logs** (when booking appointment)
2. **Server Console Logs** (from terminal)
3. **Network Tab** (screenshot of `/api/email/send` request)
4. **Patient Email** (from database - just confirm it's correct)

---

## ✅ Expected Flow

```
1. Patient books appointment
   ↓
2. Appointment created in database
   ↓
3. Zoom meeting created (if telemedicine)
   ↓
4. Email API called: /api/email/send
   ↓
5. Email sent to patient's registered email
   ↓
6. Email sent to doctor's registered email
   ↓
7. ✅ Success!
```

---

## 🔍 Most Likely Issues

Based on your setup, the most likely issues are:

1. **Gmail App Password expired/invalid** (most common)
2. **Patient email not set correctly in database**
3. **Emails going to spam folder**
4. **Dev server needs restart after .env changes**

---

## 💡 Pro Tip

Add this to your browser console to see detailed logs:

```javascript
// In browser console
localStorage.setItem('debug', 'appointments:*');
```

Then refresh and book appointment - you'll see more detailed logs!

---

**Need more help?** Share the browser console logs and server terminal output!
