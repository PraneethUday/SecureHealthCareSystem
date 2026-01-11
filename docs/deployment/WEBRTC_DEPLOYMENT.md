# WebRTC Video Call System - Deployment Checklist

## Pre-Deployment Verification

### 1. Database Setup

- [ ] **Deploy WebRTC Schema**
  ```bash
  # Run in Supabase SQL Editor (app.supabase.com)
  # Copy contents of supabase/webrtc-schema.sql
  # Execute in SQL Editor
  ```
  
  **Verification**:
  - [ ] `video_calls` table exists with all columns
  - [ ] `video_call_signaling` table exists
  - [ ] RLS policies are enabled on both tables
  - [ ] Indexes are created (performance)
  - [ ] Triggers are active (auto-update timestamps)

### 2. Realtime Configuration

- [ ] **Enable Realtime in Supabase**
  - Navigate to: Project Settings → Realtime → Manage Realtime
  - [ ] `video_calls` table enabled for replication
  - [ ] `video_call_signaling` table enabled for replication
  - [ ] Broadcast enabled (for call status updates)

### 3. Environment Variables

- [ ] **Add to `.env.local`**:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  
  # Optional TURN Server (for better NAT traversal)
  NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
  NEXT_PUBLIC_TURN_USERNAME=username
  NEXT_PUBLIC_TURN_PASSWORD=password
  ```

- [ ] **Verify for Production**:
  - [ ] All keys are correct and not exposed
  - [ ] Keys are also set in Vercel dashboard
  - [ ] Production keys are different from development

### 4. Code Deployment

- [ ] **Commit and Push**:
  ```bash
  git add .
  git commit -m "feat: add WebRTC video call system"
  git push
  ```

- [ ] **Verify in Vercel**:
  - [ ] Build succeeds without errors
  - [ ] No TypeScript compilation errors
  - [ ] Environment variables are set in deployment settings

### 5. API Routes Verification

Test these endpoints:

- [ ] **POST** `/api/video-calls/initiate`
  ```bash
  curl -X POST http://localhost:3000/api/video-calls/initiate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "appointmentId": "uuid-here",
      "doctorId": "uuid-here"
    }'
  ```
  Expected: `{ "success": true, "callId": "uuid" }`

- [ ] **GET** `/api/appointments/[appointmentId]/details`
  ```bash
  curl http://localhost:3000/api/appointments/uuid-here/details
  ```
  Expected: `{ "appointment_date": "...", "patient_name": "..." }`

### 6. Browser Compatibility

Test on:
- [ ] Chrome/Chromium (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Mobile: iOS Safari, Chrome Android

**Critical Features**:
- [ ] Camera/microphone access request works
- [ ] Video streams render correctly
- [ ] Audio plays without distortion
- [ ] Buttons are clickable on mobile
- [ ] Portrait/landscape orientation works

### 7. Functional Testing

#### Patient-Side

- [ ] Can see "Start Video Call" button on scheduled appointments
- [ ] Button is disabled on past appointments
- [ ] Button is disabled on completed/cancelled appointments
- [ ] Clicking button requests camera/mic permissions
- [ ] Permission grant allows media access
- [ ] Permission deny shows helpful error message
- [ ] Call status changes to "calling" when initiated
- [ ] Local video feed appears in picture-in-picture corner
- [ ] Receives remote video when doctor accepts

#### Doctor-Side

- [ ] Incoming call modal appears when patient calls
- [ ] Modal shows patient name and appointment details
- [ ] Shows patient's initiation time
- [ ] Can accept call
  - [ ] Call status changes to "accepted"
  - [ ] Local media access requested
  - [ ] Navigates to call page
  - [ ] Can see patient's video feed
  
- [ ] Can reject call
  - [ ] Call status changes to "rejected"
  - [ ] Modal closes
  - [ ] Returns to dashboard

#### During Call

- [ ] Both parties see dual video feeds
- [ ] Local video (mirrored) appears in corner
- [ ] Remote video fills screen
- [ ] Call duration timer counts up
- [ ] Connection status shows "Connected"

#### Call Controls

- [ ] **Mute Button**
  - [ ] Toggles red when muted
  - [ ] Microphone actually mutes
  - [ ] Works during active call
  
- [ ] **Camera Button**
  - [ ] Toggles red when camera off
  - [ ] Video stream stops when disabled
  - [ ] "Camera Off" badge appears
  
- [ ] **End Call Button**
  - [ ] Ends call for both parties
  - [ ] Updates status to "ended"
  - [ ] Returns to dashboard
  - [ ] Cleans up resources

### 8. Security Testing

- [ ] **Cannot start call as doctor** (patient-only feature)
- [ ] **Cannot call wrong doctor** (validates doctor_id)
- [ ] **Cannot call cancelled appointment** (status validation)
- [ ] **Cannot access call page without being participant**
  - [ ] Patient trying to access doctor's call → error
  - [ ] Logged-out user → redirected to login
  - [ ] Wrong user ID in URL → error
- [ ] **RLS policies prevent unauthorized access**
  - [ ] Can't query other users' calls
  - [ ] Can't modify other users' calls

### 9. Error Handling

- [ ] **Network Disconnection**
  - [ ] Shows "Connecting..." status
  - [ ] Eventually shows error
  - [ ] User can end call manually
  
- [ ] **Media Access Denied**
  - [ ] Clear error message displayed
  - [ ] User can check browser permissions
  - [ ] Helpful guidance provided
  
- [ ] **Appointment Not Found**
  - [ ] Error shown before call created
  - [ ] User guided to fix issue
  
- [ ] **Doctor Not Available**
  - [ ] Call times out after reasonable period
  - [ ] Status changes to "missed"
  - [ ] Patient returns to dashboard

### 10. Performance Verification

- [ ] **Initial Load**
  - [ ] Dashboard loads in < 2 seconds
  - [ ] Call page loads in < 3 seconds
  
- [ ] **Call Quality**
  - [ ] Video starts within 2-3 seconds after acceptance
  - [ ] No lag in mute/camera controls
  - [ ] No jitter in video stream (with good internet)
  
- [ ] **Memory Usage**
  - [ ] No memory leaks over 10+ minute calls
  - [ ] Resources cleaned up after call ends
  
- [ ] **Database Queries**
  - [ ] No N+1 query problems
  - [ ] Signaling messages don't accumulate indefinitely

### 11. Logging & Monitoring

- [ ] **Browser Console**
  - [ ] Appropriate console.log statements for debugging
  - [ ] No excessive error messages
  - [ ] Sensitive data (tokens) not logged
  
- [ ] **Supabase Logs**
  - [ ] Check Realtime connection logs
  - [ ] Check RLS policy evaluation logs
  - [ ] No authentication errors

### 12. Documentation

- [ ] **WEBRTC_GUIDE.md** is accurate
  - [ ] All endpoints documented
  - [ ] All components documented
  - [ ] Troubleshooting section complete
  
- [ ] **Code Comments**
  - [ ] Complex WebRTC logic is commented
  - [ ] Async operations are explained
  - [ ] Error handling is documented

## Deployment Steps

### Step 1: Deploy Database Schema

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy contents of `supabase/webrtc-schema.sql`
5. Paste into editor
6. Click "Run"
7. Verify tables and policies created

### Step 2: Enable Realtime

1. Go to Project Settings
2. Navigate to Realtime
3. Click "Manage Realtime"
4. Enable `video_calls` table
5. Enable `video_call_signaling` table
6. Save changes

### Step 3: Set Environment Variables

**Local Development**:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

**Vercel Production**:
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add all three variables
4. For each variable, select production environment
5. Save changes
6. Redeploy

### Step 4: Verify Build

```bash
npm run build
# Should complete without errors

npm start
# Should start server successfully
```

### Step 5: Deploy to Production

```bash
git push  # Triggers Vercel deployment
# Wait for build to complete
# Verify on production URL
```

## Post-Deployment Testing

1. **Test Call Flow**:
   - Patient: Start call
   - Doctor: Receive & accept
   - Verify audio/video
   - End call

2. **Monitor Realtime**:
   - Watch call status updates in Supabase
   - Verify signaling messages are transmitted
   - Check message cleanup (24-hour retention)

3. **Check Logs**:
   - No errors in Vercel logs
   - No errors in Supabase logs
   - Realtime connections stable

4. **Production Verification**:
   - Can access video call feature
   - All buttons work
   - Audio/video quality acceptable

## Rollback Plan

If issues occur:

1. **Immediate Revert**:
   ```bash
   git revert HEAD
   git push  # Vercel auto-deploys
   ```

2. **Disable WebRTC Feature** (without full revert):
   - Hide "Start Video Call" button in AppointmentCard
   - Set feature flag to false
   - Users can still access existing calls

3. **Database Rollback**:
   - If schema has issues, restore from backup
   - Supabase → Backups → Restore

## Maintenance

### Daily

- [ ] Monitor Realtime connections
- [ ] Check for WebRTC errors in logs
- [ ] Verify call quality metrics

### Weekly

- [ ] Review database cleanup (signaling messages)
- [ ] Check RLS policy performance
- [ ] Monitor storage usage

### Monthly

- [ ] Analyze call patterns and usage
- [ ] Review performance metrics
- [ ] Check for any recurring issues

## Support

If issues arise:

1. **Check WEBRTC_GUIDE.md** - Troubleshooting section
2. **Review browser console** - Client-side errors
3. **Check Supabase logs** - Server-side issues
4. **Verify network** - Connection to STUN/TURN servers
5. **Test with WebRTC samples** - Isolate if issue is WebRTC vs app

## Success Criteria

✅ All tests pass
✅ Call flow works end-to-end
✅ Video/audio quality acceptable
✅ No security vulnerabilities
✅ Performance meets targets
✅ Realtime updates reliable
✅ Error handling graceful
✅ Documentation complete
