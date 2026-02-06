# Secure Authentication - Setup Checklist ✅

## Pre-Implementation Checklist

- [ ] All code changes completed
- [ ] Dependencies installed (nodemailer)
- [ ] Environment variables prepared
- [ ] Database migration script ready

---

## Step 1: Environment Setup ⚙️

### In `.env.local`:

Add these lines (you need to create/update this file):

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### Getting Gmail App Password:

1. Go to [Google Account](https://myaccount.google.com)
2. Select **Security** from the left menu
3. Enable **2-Step Verification** (if not enabled)
4. Scroll down to **App passwords**
5. Select **Mail** and **Windows Computer**
6. Copy the 16-character password
7. Paste as `EMAIL_PASSWORD` in `.env.local`

**Alternative Providers:**
- SendGrid: [signup.sendgrid.com](https://signup.sendgrid.com)
- AWS SES: [AWS Console](https://console.aws.amazon.com/ses)
- Mailgun: [mailgun.com](https://www.mailgun.com)

---

## Step 2: Database Migration 🗄️

### Part A: Import Schema

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your **SecureHealthCareSystem** project

2. **Navigate to SQL Editor**
   - Left sidebar → **SQL Editor**
   - Click **+ New Query**

3. **Copy Schema File**
   - Open: `/supabase/auth-mfa-schema.sql`
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

4. **Paste in Supabase**
   - In SQL Editor query box, paste the contents
   - Click **Run** button (or Ctrl+Enter)

5. **Verify Success**
   - Should see message: "Success!"
   - Check for any errors in output

### Part B: Verify Tables Created

In Supabase Dashboard → **SQL Editor**, run this verification query:

```sql
-- Verify new tables exist
SELECT 
  'otp_logs' as table_name, COUNT(*) as records FROM otp_logs
UNION ALL
SELECT 'login_audit', COUNT(*) FROM login_audit
UNION ALL
SELECT 'password_history', COUNT(*) FROM password_history;
```

Expected output:
```
table_name      | records
otp_logs        | 0
login_audit     | 0
password_history| 0
```

---

## Step 3: Code Verification ✓

### Check Files Exist:

- [ ] `/lib/security.ts` - Security utilities
- [ ] `/lib/email.ts` - Email service
- [ ] `/app/api/auth/verify-otp/route.ts` - OTP endpoint
- [ ] `/app/login/components/OTPForm.tsx` - OTP component
- [ ] `/supabase/auth-mfa-schema.sql` - Database schema

### Check Dependencies:

Run in terminal:
```bash
npm list nodemailer
npm list bcryptjs
```

Expected output:
```
├── bcryptjs@3.0.3
└── nodemailer@6.x.x
```

If not installed, run:
```bash
npm install nodemailer @types/nodemailer bcryptjs @types/bcryptjs
```

---

## Step 4: Start Development Server 🚀

```bash
# Stop any running server (Ctrl+C)

# Clear next.js cache (optional)
rm -r .next

# Start development server
npm run dev
```

You should see:
```
▲ Next.js 15.1.6
- Local: http://localhost:3000
```

---

## Step 5: Test Registration 🧪

### Test Case 1: New User Registration

1. Open browser: http://localhost:3000
2. Click **Register → Register as Patient**
3. Fill form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@gmail.com` (use your real email)
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Fill other required fields

4. Click **Register**

5. Check email inbox
   - Should receive 2 emails:
     - Registration confirmation
     - OTP verification code

6. Verify in Supabase:
   - Go to **SQL Editor**
   - Run:
   ```sql
   SELECT patient_id, email, password_hash, is_mfa_enabled 
   FROM patients 
   WHERE email = 'john.doe@gmail.com';
   ```
   - Should see:
     - `password_hash` = `$2b$12$...` (bcrypt format, NOT plaintext)
     - `is_mfa_enabled` = `true`

---

## Step 6: Test Login with MFA 🔐

### Test Case 2: Login with Wrong Password

1. Go to http://localhost:3000/login
2. Select **Patient** role
3. Enter:
   - Email: `john.doe@gmail.com`
   - Password: `WrongPassword`
4. Click **Sign In**

Expected result:
- ❌ Error: "Invalid credentials"
- Attempt counter incremented in database

### Test Case 3: Login with Correct Password & OTP

1. Go to http://localhost:3000/login
2. Select **Patient** role
3. Enter:
   - Email: `john.doe@gmail.com`
   - Password: `SecurePass123!`
4. Click **Sign In**

Expected result:
- ✅ See: "OTP sent to your email"
- New screen: "Enter verification code"

5. Check email
   - Should have 6-digit OTP code
   - Code is valid for 10 minutes

6. Enter OTP code
7. Click **Verify Code**

Expected result:
- ✅ Redirected to patient dashboard
- ✅ Session created successfully

### Verify OTP was Logged:

In Supabase **SQL Editor**:
```sql
SELECT * FROM otp_logs 
WHERE user_id = 'P001' 
ORDER BY created_at DESC 
LIMIT 5;
```

Should see:
- `is_verified` = `true`
- `attempts` = `0` (if correct first try)
- `verified_at` = current timestamp

---

## Step 7: Test Account Lockout 🔒

### Test Case 4: Failed Login Attempts

1. Go to http://localhost:3000/login
2. Try to login 5 times with **wrong password**
3. On 5th attempt:

Expected result:
- ❌ Error: "Account locked. Try again in 30 minutes."

Verify in Supabase:
```sql
SELECT patient_id, email, login_attempts, is_locked, locked_until 
FROM patients 
WHERE email = 'john.doe@gmail.com';
```

Should show:
- `login_attempts` = `5`
- `is_locked` = `true`
- `locked_until` = 30 minutes from now

---

## Step 8: Test OTP Attempts 

### Test Case 5: Wrong OTP Multiple Times

1. Login with correct credentials
2. See OTP verification screen
3. Enter **wrong code** 5 times

Expected result:
- After 1st wrong OTP: "Invalid OTP. 4 attempts remaining."
- After 2nd wrong OTP: "Invalid OTP. 3 attempts remaining."
- ...
- After 5th wrong OTP: "Maximum OTP attempts exceeded. Request a new OTP."

Verify in Supabase:
```sql
SELECT * FROM otp_logs 
WHERE user_id = 'P001' AND is_verified = false 
ORDER BY created_at DESC LIMIT 1;
```

Should show:
- `attempts` = `5`
- `is_verified` = `false`

---

## Step 9: Verify Audit Trail 📋

Check all login attempts logged:

```sql
-- View all login attempts
SELECT user_id, user_role, login_status, mfa_verified, created_at 
FROM login_audit 
WHERE user_id = 'P001'
ORDER BY created_at DESC;
```

Should see entries like:
- `success` - Successful logins
- `failed_password` - Wrong password attempts
- `failed_mfa` - Wrong OTP attempts

---

## Step 10: Production Deployment Checklist

Before deploying to production:

- [ ] Email provider credentials verified
- [ ] Database backups configured
- [ ] `.env.local` variables added to production environment
- [ ] SSL/HTTPS enabled
- [ ] Password requirements enforced
- [ ] Audit logs monitored
- [ ] OTP emails tested in production
- [ ] Error handling tested
- [ ] Rate limiting configured (recommended)
- [ ] CORS settings configured

---

## Troubleshooting 🔧

### Issue: "nodemailer is not installed"

**Solution:**
```bash
npm install nodemailer @types/nodemailer
npm run dev
```

### Issue: "EMAIL_USER is not defined"

**Solution:**
1. Create `.env.local` file in project root
2. Add:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
3. Restart dev server: `npm run dev`

### Issue: "OTP not arriving"

**Solution:**
1. Check spam/junk folder
2. Verify email credentials are correct
3. Try Gmail App Password (not regular password)
4. Check `.env.local` has EMAIL_USER and EMAIL_PASSWORD

### Issue: "password_hash is NULL"

**Solution:**
1. Ensure database schema was imported
2. Run SQL migration again: `/supabase/auth-mfa-schema.sql`
3. New registrations should have `password_hash`

### Issue: "OTP expired" error

**Solution:**
- OTP is valid for only 10 minutes
- Request new OTP by logging in again

---

## Success Indicators ✅

Your implementation is successful when:

- [ ] Registration creates user with `password_hash` (not plaintext)
- [ ] Login requires email and password
- [ ] OTP sent to email after successful password verification
- [ ] OTP verification completes login
- [ ] Wrong password 5 times → Account locked 30 minutes
- [ ] All attempts logged in `login_audit` table
- [ ] Failed OTP 5 times → Must login again
- [ ] Session created after successful login
- [ ] Dashboard accessible after authentication

---

## Documentation Links

- **Full Guide**: `/docs/guides/SECURE_AUTHENTICATION_GUIDE.md`
- **Implementation Summary**: `/docs/SECURE_AUTH_IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `/supabase/auth-mfa-schema.sql`
- **Email Service**: `/lib/email.ts`
- **Security Utils**: `/lib/security.ts`

---

## Support Contacts

- **Supabase Issues**: https://supabase.com/docs
- **Email Provider Help**:
  - Gmail: https://support.google.com
  - SendGrid: https://sendgrid.com/docs
  - AWS SES: https://aws.amazon.com/ses/

---

**Checklist Status**: Use this as a reference during setup  
**Last Updated**: February 4, 2026  
**Version**: 1.0.0
