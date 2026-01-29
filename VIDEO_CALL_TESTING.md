# Video Call Testing Guide

## ✅ Prerequisites

Before testing, ensure:

1. **Development server is running**
   ```bash
   npm run dev
   ```
   Server should be at: http://localhost:3000

2. **Supabase Realtime is enabled** (CRITICAL!)
   - Go to Supabase Dashboard → Database → Replication
   - Enable Realtime for these tables:
     - `video_calls`
     - `video_call_signaling`

3. **Browser permissions ready**
   - Chrome or Firefox (recommended)
   - Camera and microphone connected

## 🧪 Testing Steps

### Step 1: Open Two Browser Windows

1. **Window 1 (Patient)** - Normal browser window
   - Navigate to: http://localhost:3000

2. **Window 2 (Doctor)** - Incognito/Private window
   - Navigate to: http://localhost:3000

> **Why Incognito?** To maintain separate sessions for patient and doctor

### Step 2: Login to Both Accounts

**Window 1 - Patient Login:**
- Role: Patient
- Identifier: (any patient email, e.g., `P001` or patient email)
- Password: (patient password)

**Window 2 - Doctor Login:**
- Role: Doctor
- Identifier: `D001`
- Password: (doctor password)

### Step 3: Start Video Call (Patient Side)

**In Window 1 (Patient):**

1. Go to Patient Dashboard
2. Find an upcoming appointment with Doctor D001
3. Click **"Start Video Call"** button
4. ✋ **Browser will ask for camera/microphone permissions** - Click **"Allow"**
5. Wait 2-3 seconds for call setup
6. You should see:
   - ✅ Your own video feed
   - ⏳ "Calling..." or "Waiting for doctor..." status

**Expected Console Logs (Patient):**
```
[Hook] 🎥 Initializing local media...
[Hook] ✅ Camera and microphone access granted!
[Hook] Call created: <call-id>
[Hook] Patient sending ICE candidate to doctor
```

### Step 4: Accept Call (Doctor Side)

**In Window 2 (Doctor):**

1. You should see an **Incoming Call Modal** pop up automatically
   - Shows patient name
   - Shows call time
2. Click **"Accept"** button
3. ✋ **Browser will ask for camera/microphone permissions** - Click **"Allow"**
4. Wait 2-3 seconds for connection
5. You should see:
   - ✅ Your own video feed (small, bottom-right)
   - ✅ Patient's video feed (large, main screen)
   - ✅ "Connected" status
   - ✅ Call duration timer

**Expected Console Logs (Doctor):**
```
[IncomingCallModal] New incoming call: <call-id>
[Hook] Doctor accepting call
[Hook] ✅ Doctor's media initialized successfully
[Hook] Processing offer from: patient
[Hook] Doctor sending ICE candidate to patient
```

### Step 5: Verify Connection

**Both Windows - Check:**

✅ **Video:**
- Patient window: See your own video + "Waiting for doctor" or doctor's video
- Doctor window: See patient's video (large) + your own video (small)

✅ **Status:**
- Should change from "Calling..." → "Connected"
- Call duration timer starts (e.g., "0:05", "0:10")

✅ **Audio:**
- Speak in one window, listen in the other
- Audio should be clear

### Step 6: Test Call Controls

**Both Windows - Try these controls:**

1. **🔇 Mute/Unmute Audio**
   - Click microphone button
   - Red = muted, gray = unmuted
   - Other party shouldn't hear you when muted

2. **📹 Enable/Disable Video**
   - Click camera button
   - Red = disabled, gray = enabled
   - Other party shouldn't see you when disabled

3. **❌ End Call**
   - Click red "End Call" button
   - Both parties disconnect
   - Redirect to dashboard

## 🐛 Troubleshooting

### Issue: "Doctor doesn't receive notification"

**Cause:** Supabase Realtime not enabled

**Solution:**
```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;
```

### Issue: "Permission denied" for camera/microphone

**Solution:**
1. Click the lock icon in browser address bar
2. Set Camera and Microphone to "Allow"
3. Refresh the page
4. Try starting call again

### Issue: Stuck on "Calling..." or "Connecting..."

**Check (in Browser Console - F12):**
- Look for `🧊 Processing ICE candidate` messages
- Should see multiple ICE candidates exchanged
- Check for any red error messages

**Common Causes:**
- One party didn't allow camera/microphone
- Firewall blocking WebRTC
- Supabase Realtime not working

**Solution:**
- Refresh both windows
- Allow permissions
- Check Supabase Realtime is enabled

### Issue: "No camera or microphone found"

**Solution:**
- Make sure camera/microphone are connected
- Close other apps using camera (Zoom, Teams, etc.)
- Try a different browser
- Restart browser

### Issue: Can see video but no audio

**Check:**
- Microphone is not muted (both in app and system)
- Volume is turned up
- Correct microphone/speaker selected in system settings

## 📊 Success Criteria

✅ Patient can initiate call  
✅ Doctor receives real-time notification  
✅ Doctor can accept call  
✅ Both parties see each other's video  
✅ Both parties can hear each other  
✅ Mute/unmute works  
✅ Video enable/disable works  
✅ Call can be ended from either side  
✅ Call duration is tracked  

## 🔍 Debug Console Logs

Open browser DevTools (F12) → Console tab

**Patient Expected Logs:**
```
[Hook] 🎥 Initializing local media (camera & microphone)...
[Hook] 📸 Requesting camera and microphone access...
[Hook] ✅ Camera and microphone access granted!
[Hook] Call created: <uuid>
[Hook] 📤 Creating and sending offer
[Hook] 🧊 Patient sending ICE candidate to doctor
[Hook] 📥 Processing answer from: doctor
[Hook] ✅ Remote description (answer) set successfully
[CallStart] ✅ Local stream attached to video element
[CallStart] Remote stream attached
```

**Doctor Expected Logs:**
```
[IncomingCallModal] Setting up subscription for doctor: <uuid>
[IncomingCallModal] New incoming call: <call-id>
[Hook] Doctor accepting call
[Hook] 🎥 Initializing doctor's camera and microphone...
[Hook] ✅ Doctor's media initialized successfully
[Hook] 📥 Processing offer from: patient
[Hook] 📤 Creating and sending answer...
[Hook] ✅ Answer sent successfully
[Hook] 🧊 Doctor sending ICE candidate to patient
[Hook] 🧊 ICE candidate added successfully
[CallPage] Local stream attached
[CallPage] Remote stream attached
```

## 🚀 Next Steps

After successful testing:
1. Test with different doctors (D002, D003, etc.)
2. Test call rejection
3. Test network interruption handling
4. Deploy to production with HTTPS
5. Add TURN servers for better reliability

## 📝 Notes

- **HTTPS Required in Production:** Browsers require HTTPS for camera/microphone access
- **STUN Servers:** Currently using Google STUN servers (free)
- **TURN Servers:** Not configured (optional, for restrictive firewalls)
- **Browser Support:** Best in Chrome/Firefox, Safari may have limitations
