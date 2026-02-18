# Account Lockout & Security System

## Overview

This system implements a comprehensive account lockout mechanism to protect against brute-force attacks and unauthorized access attempts. It tracks all login attempts, automatically locks accounts after multiple failed attempts, and provides admin controls for manual account management.

## Features

### 1. **Automatic Account Lockout**
- **Threshold**: 5 failed login attempts within 15 minutes
- **Lock Duration**: 3 minutes (auto-unlock)
- **User Feedback**: Shows remaining attempts after each failed login

### 2. **Failed Attempt Tracking**
- Records every login attempt (success and failure)
- Tracks IP address and user agent for security auditing
- Stores failure reasons (invalid_password, user_not_found, account_locked, etc.)

### 3. **Admin Controls**
- **Manual Lock**: Admins can manually lock any account indefinitely
- **Manual Unlock**: Admins can unlock locked accounts immediately
- **View Locked Accounts**: Dashboard to see all currently locked accounts
- **Login History**: View complete login attempt history for any user

### 4. **User Experience**
- Clear error messages showing remaining attempts
- Countdown timer for locked accounts
- Different messages for auto-lock vs admin-lock

## Database Schema

### Tables

#### `login_attempts`
Tracks all login attempts (successful and failed).

```sql
- id: UUID (Primary Key)
- user_id: TEXT (username/email/ID used in login)
- user_role: TEXT (patient, doctor, nurse, staff, admin)
- attempt_type: TEXT (success, failed)
- failure_reason: TEXT (invalid_password, account_locked, user_not_found)
- ip_address: TEXT
- user_agent: TEXT
- attempted_at: TIMESTAMP
```

#### `account_locks`
Manages locked accounts.

```sql
- id: UUID (Primary Key)
- user_id: TEXT (UNIQUE - the locked username)
- user_role: TEXT
- failed_attempts_count: INTEGER
- locked_at: TIMESTAMP
- locked_until: TIMESTAMP (auto-unlock time)
- is_manually_locked: BOOLEAN (admin manual lock)
- unlocked_by_admin_id: TEXT
- unlocked_at: TIMESTAMP
- lock_reason: TEXT
```

### Database Functions

#### `is_account_locked(user_id, user_role)`
Checks if an account is currently locked.

**Returns:**
- `is_locked`: BOOLEAN
- `locked_until`: TIMESTAMP
- `failed_attempts`: INTEGER
- `lock_reason`: TEXT

#### `record_login_attempt(user_id, user_role, attempt_type, failure_reason, ip_address, user_agent)`
Records a login attempt and handles auto-locking.

**Returns:**
- `should_lock`: BOOLEAN
- `failed_count`: INTEGER
- `locked_until`: TIMESTAMP

#### `admin_unlock_account(user_id, user_role, admin_id)`
Admin function to unlock an account.

**Returns:** BOOLEAN (success)

#### `admin_lock_account(user_id, user_role, admin_id, reason)`
Admin function to manually lock an account.

**Returns:** BOOLEAN (success)

#### `get_recent_failed_attempts(user_id, user_role, minutes)`
Gets count of recent failed attempts.

**Returns:** INTEGER

## Usage

### In Login Flow

```typescript
import { checkAccountLock, recordLoginAttempt } from "@/lib/account-lockout";

// 1. Check if account is locked
const lockStatus = await checkAccountLock(identifier, role);
if (lockStatus.isLocked) {
  // Handle locked account
  if (lockStatus.isManuallyLocked) {
    return "Account locked by administrator. Contact support.";
  } else {
    return `Account locked. Try again in ${minutesRemaining} minutes.`;
  }
}

// 2. Verify password
const passwordValid = await verifyPassword(password, hash);

if (!passwordValid) {
  // Record failed attempt
  const result = await recordLoginAttempt(
    identifier,
    role,
    "failed",
    "invalid_password"
  );

  if (result.shouldLock) {
    return "Account locked. Try again in 3 minutes.";
  }

  const remaining = 5 - result.failedCount;
  return `Invalid credentials. ${remaining} attempts remaining.`;
}

// 3. Record successful login
await recordLoginAttempt(identifier, role, "success");
```

### Admin Functions

```typescript
import { 
  adminUnlockAccount, 
  adminLockAccount,
  getLockedAccounts 
} from "@/lib/account-lockout";

// Unlock an account
const success = await adminUnlockAccount(userId, userRole, adminId);

// Manually lock an account
const success = await adminLockAccount(
  userId, 
  userRole, 
  adminId, 
  "Suspicious activity detected"
);

// Get all locked accounts
const lockedAccounts = await getLockedAccounts();
```

## Error Messages

### User-Facing Messages

1. **Failed Login (Attempts Remaining)**:
   ```
   Invalid credentials. 4 attempts remaining before account lockout.
   Invalid credentials. 3 attempts remaining before account lockout.
   Invalid credentials. 2 attempts remaining before account lockout.
   Invalid credentials. 1 attempt remaining before account lockout.
   ```

2. **Account Locked (Auto)**:
   ```
   Account locked due to too many failed login attempts. 
   Please try again in 3 minutes.
   ```

3. **Account Locked (Manual)**:
   ```
   Your account has been locked by an administrator. 
   Please contact support.
   ```

4. **Account Locked (Time Remaining)**:
   ```
   Account is locked due to too many failed login attempts. 
   Please try again in 2 minutes.
   ```

## Security Features

### 1. **Rate Limiting**
- Tracks attempts within a 15-minute sliding window
- Only recent attempts count toward lockout threshold

### 2. **Auto-Unlock**
- Accounts automatically unlock after 3 minutes
- No manual intervention required for temporary locks

### 3. **Audit Trail**
- Complete history of all login attempts
- IP address and user agent tracking
- Timestamps for all events

### 4. **Admin Override**
- Admins can unlock accounts immediately
- Admins can manually lock suspicious accounts
- All admin actions are logged

## Setup Instructions

### 1. Run Database Migration

```bash
# Option 1: Using Supabase SQL Editor
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# Paste and run: supabase/account-lockout-schema.sql

# Option 2: Using psql
psql "postgresql://..." -f supabase/account-lockout-schema.sql
```

### 2. Verify Tables Created

```sql
SELECT * FROM login_attempts LIMIT 1;
SELECT * FROM account_locks LIMIT 1;
```

### 3. Test the System

```typescript
// Test failed login
// Try logging in with wrong password 5 times
// Account should lock on 5th attempt

// Test auto-unlock
// Wait 3 minutes
// Try logging in again - should work

// Test admin unlock
// Lock account with wrong password
// Use admin panel to unlock
// Should be able to login immediately
```

## Monitoring & Maintenance

### View Recent Failed Attempts

```sql
SELECT 
  user_id,
  user_role,
  attempt_type,
  failure_reason,
  attempted_at
FROM login_attempts
WHERE attempt_type = 'failed'
ORDER BY attempted_at DESC
LIMIT 50;
```

### View Currently Locked Accounts

```sql
SELECT 
  user_id,
  user_role,
  failed_attempts_count,
  locked_at,
  locked_until,
  is_manually_locked,
  lock_reason
FROM account_locks
WHERE locked_until > NOW() OR is_manually_locked = true
ORDER BY locked_at DESC;
```

### Cleanup Old Data

The system includes an automatic cleanup function that removes:
- Login attempts older than 90 days
- Expired non-manual locks

```sql
SELECT cleanup_old_security_data();
```

## Configuration

### Adjust Lockout Settings

Edit `supabase/account-lockout-schema.sql`:

```sql
-- Change max attempts (default: 5)
v_max_attempts INTEGER := 5;

-- Change lock duration (default: 3 minutes)
v_lock_duration INTERVAL := INTERVAL '3 minutes';

-- Change lookback window (default: 15 minutes)
v_failed_count := get_recent_failed_attempts(p_user_id, p_user_role, 15);
```

## Troubleshooting

### Account Won't Unlock

1. Check if manually locked:
   ```sql
   SELECT is_manually_locked FROM account_locks WHERE user_id = 'USER_ID';
   ```

2. If manually locked, admin must unlock:
   ```typescript
   await adminUnlockAccount(userId, userRole, adminId);
   ```

### Failed Attempts Not Counting

1. Verify function is being called:
   ```typescript
   console.log("Recording attempt:", await recordLoginAttempt(...));
   ```

2. Check database permissions:
   ```sql
   -- Ensure RLS policies allow inserts
   SELECT * FROM login_attempts ORDER BY attempted_at DESC LIMIT 1;
   ```

## Future Enhancements

- [ ] Email notifications on account lockout
- [ ] CAPTCHA after 3 failed attempts
- [ ] IP-based rate limiting
- [ ] Geolocation tracking for suspicious logins
- [ ] Two-factor authentication requirement after lockout
- [ ] Customizable lockout thresholds per role
- [ ] Dashboard analytics for security monitoring

## Files Modified

1. `supabase/account-lockout-schema.sql` - Database schema and functions
2. `lib/account-lockout.ts` - Helper functions
3. `app/actions/auth-actions.ts` - Login flow integration
4. `docs/ACCOUNT_LOCKOUT.md` - This documentation

## Support

For issues or questions, contact the development team or refer to the main security documentation.
