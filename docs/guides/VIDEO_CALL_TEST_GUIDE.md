# Video Call Testing Guide

## Overview
The video call feature has been fixed with comprehensive improvements:
- ✅ Proper peer connection initialization sequence
- ✅ ICE candidate handlers set up BEFORE offer/answer exchange
- ✅ Enhanced logging with emojis for easy debugging
- ✅ Proper error handling and validation throughout
- ✅ Fixed null peer connection errors

## Server Status
Server is running on: **http://localhost:3001**

## Test Instructions

### Step 1: Prepare Two Browser Windows

1. **Browser Window 1** - For Patient:
   - Open Chrome/Firefox in normal mode
   - Go to: `http://localhost:3001`
   
2. **Browser Window 2** - For Doctor:
   - Open Chrome/Firefox in Incognito/Private mode (to have separate session)
   - Go to: `http://localhost:3001`

### Step 2: Login

**Window 1 (Patient):**
- Login with patient credentials
- Example: `jane.doe@hospital.com` / password

**Window 2 (Doctor):**
- Login with doctor credentials  
- Example: `dr.smith@hospital.com` / password

### Step 3: Start Video Call

**Window 1 (Patient):**
1. Go to patient dashboard
2. Find an upcoming appointment with the doctor you logged in as
3. Click "Start Video Call" button
4. **IMPORTANT**: Browser will prompt for camera/microphone permissions
5. Click "Allow" when prompted
6. Wait for the call interface to appear

### Step 4: Doctor Accepts Call

**Window 2 (Doctor):**
1. You should see an incoming call modal popup automatically
2. Click "Accept Call" button
3. **IMPORTANT**: Browser will prompt for camera/microphone permissions
4. Click "Allow" when prompted
5. The call interface should appear

### Step 5: Verify Connection

**Both Windows:**
- You should see:
  - ✅ Your own video feed (mirrored for patient, normal for doctor)
  - ✅ Remote participant's video feed
  - ✅ Connection status changes from "Connecting..." to "Connected"
  - ✅ Call duration timer starts counting

### Console Logs to Watch For

Open browser DevTools (F12) → Console tab on both windows.

**Expected Patient Console Logs:**
```
[Hook] 🎥 Initializing local media...
[Hook] 📸 Requesting camera and microphone access...
[Hook] ✅ Camera and microphone access granted!
[Hook] 📤 Creating and sending offer
[Hook] 🧊 Patient sending ICE candidate to doctor
[Hook] 📥 Processing answer from: doctor
[Hook] ✅ Answer processed successfully
[CallStart] ✅ Local stream attached
[CallStart] ✅ Remote stream attached
```

**Expected Doctor Console Logs:**
```
[Hook] 👨‍⚕️ Doctor accepting call...
[Hook] 🎥 Initializing doctor's camera and microphone...
[Hook] ✅ Doctor's media initialized successfully
[Hook] ✅ Peer connection verified
[Hook] 🧊 Setting up ICE candidate handler for doctor...
[Hook] 📥 Processing offer from: patient
[Hook] 📤 Creating and sending answer...
[Hook] ✅ Answer sent successfully
[Hook] 🧊 Doctor sending ICE candidate to patient
[CallPage] ✅ Local stream attached to video element
[CallPage] ✅ Remote stream attached to video element
```

### Step 6: Test Call Controls

**Both Windows - Test these buttons:**
- 🔇 Mute/Unmute audio button
- 📹 Enable/Disable video button
- ❌ End call button

### Troubleshooting

#### Issue: "Peer connection not initialized"
**Cause**: Media initialization failed before peer connection was created
**Check**:
- Did you allow camera/microphone permissions?
- Are camera and microphone connected and working?
- Check console for permission errors

#### Issue: Video not showing
**Check Console For**:
- "Camera/microphone permission denied" → Allow permissions and refresh
- "No camera or microphone found" → Connect devices and refresh
- Stream track counts should show: `video: 1, audio: 1`

#### Issue: Stays "Connecting..." forever
**Check**:
- Both parties allowed camera/microphone permissions
- Look for ICE candidate exchange logs (🧊 emoji)
- Check if offer/answer were exchanged (📥 📤 emojis)
- Verify Supabase Realtime is enabled for tables

#### Issue: Doctor doesn't receive notification
**Solution**: Enable Supabase Realtime
1. Go to Supabase Dashboard → Database → Replication
2. Enable Realtime for:
   - `video_calls` table
   - `video_call_signaling` table
3. Or run SQL: `/supabase/enable-realtime.sql`

### Success Criteria

✅ Patient can start call and camera permission is requested  
✅ Doctor receives real-time notification  
✅ Doctor can accept call and camera permission is requested  
✅ Both parties see their own video feed  
✅ Both parties see remote participant's video feed  
✅ Connection status shows "Connected"  
✅ Audio/video controls work (mute/unmute)  
✅ Call can be ended by either party

## Common Test Scenarios

### Scenario 1: Basic Call Flow (MUST TEST)
Patient → Start Call → Doctor Accepts → Both see video → End Call

### Scenario 2: Permission Denied
Deny camera permission → Should show clear error message → Allow and retry

### Scenario 3: No Devices  
Disconnect camera → Should show "No camera found" error

### Scenario 4: Network Issues
Check console for ICE candidate exchange → Should show multiple ICE candidates being sent

## Known Limitations

1. **Supabase Realtime**: Must be enabled in Supabase dashboard for doctor notifications
2. **STUN/TURN**: Currently using Google STUN servers only (no TURN for relay)
3. **Browser Support**: Best tested in Chrome or Firefox
4. **HTTPS**: In production, HTTPS is required for camera/microphone access

## Next Steps After Successful Test

1. ✅ Mark video call feature as working
2. 📝 Document any bugs found
3. 🚀 Deploy to production with proper HTTPS
4. 🔧 Configure TURN servers for better reliability
5. 📊 Add call quality monitoring

## Support

If you encounter issues:
1. Check the console logs on both windows
2. Verify all emojis appear in the expected sequence
3. Share the console output for debugging
