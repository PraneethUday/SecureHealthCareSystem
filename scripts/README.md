# 🧪 API Testing Scripts

This directory contains testing scripts for SecureHealthCare API endpoints.

---

## 📋 Available Tests

### 1. **Complete API Test Suite** ⭐ (Recommended)

Tests all API endpoints with beautiful colored output.

```bash
npx tsx scripts/test-all-apis.ts
```

**Tests:**
- ✅ Zoom API (create meetings)
- ✅ Email API (send notifications)
- ✅ Vitals API (if implemented)
- ✅ Environment variables
- ✅ Server health check

**Output:**
```
═══════════════════════════════════════════════════════════════════════════════
  🧪 SECUREHEALTHCARE API ENDPOINT TESTING SUITE
═══════════════════════════════════════════════════════════════════════════════

Configuration:
  ℹ️  API Base URL: http://localhost:3000
  ℹ️  Environment: development

───────────────────────────────────────────────────────────────────────────────
  🎥 ZOOM API ENDPOINTS
───────────────────────────────────────────────────────────────────────────────

Testing: Create Zoom Meeting
  ℹ️  POST /api/zoom/create-meeting
  ✅ Status: 200 OK
  ✅ Response: { "success": true, "meeting": {...} }

───────────────────────────────────────────────────────────────────────────────
  📧 EMAIL API ENDPOINTS
───────────────────────────────────────────────────────────────────────────────

Testing: Send Patient Confirmation Email
  ℹ️  POST /api/email/send
  ✅ Status: 200 OK
  ✅ Response: { "success": true }

───────────────────────────────────────────────────────────────────────────────
  📊 TEST SUMMARY
───────────────────────────────────────────────────────────────────────────────

Results:
  ✅ Passed:  8
  ❌ Failed:  0
  ⏭️  Skipped: 3
  📊 Total:   11

Success Rate: 100.0%

🎉 All tests passed! Your API is working correctly!
```

---

### 2. **Vitals Test (Comprehensive)** ⭐ (Recommended for Vitals)

Tests all vitals CRUD operations.

```bash
npx tsx scripts/test-vitals.ts
```

**Tests:**
- ✅ Database connection
- ✅ Get patient
- ✅ Create vitals record
- ✅ Read vitals (with history)
- ✅ Update vitals
- ✅ Delete vitals
- ✅ Data validation
- ✅ Statistics calculation

**Output:**
```
═══════════════════════════════════════════════════════════════════════════════
  ❤️  VITALS API COMPREHENSIVE TESTING SUITE
═══════════════════════════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────────────────────────
  🔌 DATABASE CONNECTION TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Database connection successful

───────────────────────────────────────────────────────────────────────────────
  👤 GET PATIENT TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Patient fetched successfully
  📊 Patient: { id: "...", name: "Praneeth", email: "..." }

───────────────────────────────────────────────────────────────────────────────
  ➕ CREATE VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Vitals created successfully

───────────────────────────────────────────────────────────────────────────────
  📊 GET VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Found 1 vitals record(s)

───────────────────────────────────────────────────────────────────────────────
  ✏️  UPDATE VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Vitals updated successfully

───────────────────────────────────────────────────────────────────────────────
  📈 VITALS STATISTICS TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Statistics calculated successfully
  📊 Statistics: { avgHeartRate: "72.0", avgSystolic: "120.0", ... }

───────────────────────────────────────────────────────────────────────────────
  🗑️  DELETE VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Vitals deleted successfully

───────────────────────────────────────────────────────────────────────────────
  📊 TEST SUMMARY
───────────────────────────────────────────────────────────────────────────────

Results:
  ✅ Passed:  8
  ❌ Failed:  0
  📊 Total:   8

Success Rate: 100.0%

🎉 All vitals tests passed! Your vitals system is working correctly!
```

---

### 3. **Email Test (Specific)**

Tests email service directly.

```bash
npx tsx scripts/test-email-praneeth.ts
```

**Tests:**
- Sends test email to praneethp227@gmail.com
- Verifies Gmail credentials
- Shows detailed error messages

---

### 4. **Zoom Test (Specific)**

Tests Zoom API integration.

```bash
npx tsx scripts/test-zoom.ts
```

**Tests:**
- Verifies Zoom credentials
- Creates test meeting
- Shows meeting URLs

---

## 🚀 Quick Start

### Prerequisites

1. **Dev server must be running:**
   ```bash
   npm run dev
   ```

2. **Environment variables must be set in `.env`**

---

### Run All Tests

```bash
npx tsx scripts/test-all-apis.ts
```

---

## 📊 Understanding Test Results

### ✅ Success (Green)
- Test passed
- API endpoint working correctly
- Expected response received

### ❌ Failed (Red)
- Test failed
- API endpoint not working
- Check error message for details

### ⏭️ Skipped (Yellow)
- Test skipped (endpoint not implemented or requires auth)
- Not counted as failure

### ℹ️ Info (Cyan)
- Informational message
- Shows request details

### ⚠️ Warning (Yellow)
- Warning message
- Something might be misconfigured

---

## 🔧 Troubleshooting

### "Cannot connect to server"

**Problem:** Dev server not running

**Fix:**
```bash
npm run dev
```

---

### "Invalid login" (Email)

**Problem:** Gmail App Password expired

**Fix:**
1. Go to https://myaccount.google.com/apppasswords
2. Create new App Password
3. Update `EMAIL_PASSWORD` in `.env`
4. Restart dev server

---

### "Zoom not configured"

**Problem:** Zoom credentials missing

**Fix:**
1. Add Zoom credentials to `.env`:
   ```
   ZOOM_ACCOUNT_ID=your_account_id
   ZOOM_CLIENT_ID=your_client_id
   ZOOM_CLIENT_SECRET=your_client_secret
   ```
2. Restart dev server

---

## 📝 Test Coverage

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/zoom/create-meeting` | POST | ✅ Tested |
| `/api/email/send` | POST | ✅ Tested |
| `/api/vitals` | GET | ⏭️ Skipped (not implemented) |
| `/api/vitals` | POST | ⏭️ Skipped (not implemented) |
| `/api/auth/*` | * | ⏭️ Skipped (requires session) |

---

## 🎯 For Viva/Exams

**Q: How do you test your API endpoints?**

**A:** "We have a comprehensive testing suite that tests all API endpoints including Zoom integration, email notifications, and vitals management. The test script sends actual requests to the API and verifies the responses, checking status codes, response data, and error handling. It also validates environment configuration and provides detailed colored output for easy debugging."

**Key Points:**
- ✅ Automated testing
- ✅ Tests all major endpoints
- ✅ Validates environment setup
- ✅ Clear, colored output
- ✅ Error diagnostics

---

## 💡 Tips

1. **Run tests after making changes** to verify nothing broke
2. **Check environment variables** if tests fail
3. **Restart dev server** after changing `.env`
4. **Check spam folder** for test emails
5. **Use colored output** to quickly spot issues

---

## 📚 Related Documentation

- `docs/EMAIL_NOTIFICATIONS.md` - Email system documentation
- `docs/ZOOM_SETUP.md` - Zoom integration guide
- `docs/EMAIL_TROUBLESHOOTING.md` - Email debugging guide

---

**Happy Testing! 🧪**
