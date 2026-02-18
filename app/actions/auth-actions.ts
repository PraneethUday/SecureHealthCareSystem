"use server";

import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { UserRole } from "@/lib/database.types";
import { logAction } from "@/lib/logging";
import { verifyPassword, generateOTP, generateOTPExpiry, hashOTP, isPasswordExpired, validatePasswordComplexity, hashPassword } from "@/lib/security";
import { sendOTPEmail } from "@/lib/email";
import { checkAccountLock, recordLoginAttempt } from "@/lib/account-lockout";

interface LoginResult {
  success: boolean;
  message: string;
  user?: any;
  role?: UserRole;
  requiresMFA?: boolean;
  mfaToken?: string; // Temporary token for OTP verification
  requiresPasswordChange?: boolean;
}

interface OTPVerifyResult {
  success: boolean;
  message: string;
  user?: any;
  role?: UserRole;
}

export async function login(
  identifier: string,
  password: string,
  role: UserRole
): Promise<LoginResult> {
  try {
    // Determine the table based on role
    let table: string;
    let idField: string;
    let userIdField: string;

    switch (role) {
      case "admin":
        table = "admins";
        idField = "id";
        userIdField = "id";
        break;
      case "patient":
        table = "patients";
        idField = "email";
        userIdField = "patient_id";
        break;
      case "doctor":
        table = "doctors";
        idField = "doctor_id";
        userIdField = "doctor_id";
        break;
      case "nurse":
        table = "nurses";
        idField = "nurse_id";
        userIdField = "nurse_id";
        break;
      case "staff":
        table = "staff";
        idField = "staff_id";
        userIdField = "staff_id";
        break;
      default:
        return { success: false, message: "Invalid role selected" };
    }

    // Query the database for the user
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(idField, identifier)
      .single();

    if (error || !data) {
      // Record failed login attempt - user not found
      await recordLoginAttempt(
        identifier,
        role,
        "failed",
        "user_not_found"
      );

      await logAction({
        userId: identifier,
        userRole: role,
        action: "login_failed",
        details: "Invalid credentials",
        status: "failure",
      });
      return { success: false, message: "Invalid credentials" };
    }

    // Check if account is locked using new centralized system
    const lockStatus = await checkAccountLock(identifier, role);
    if (lockStatus.isLocked) {
      if (lockStatus.isManuallyLocked) {
        // Manually locked by admin - no auto-unlock
        await recordLoginAttempt(
          identifier,
          role,
          "failed",
          "account_locked_by_admin"
        );

        await logAction({
          userId: identifier,
          userRole: role,
          action: "login_failed",
          details: "Account manually locked by administrator",
          status: "failure",
        });

        return {
          success: false,
          message: "Your account has been locked by an administrator. Please contact support.",
        };
      } else if (lockStatus.lockedUntil) {
        // Auto-locked due to failed attempts
        const now = new Date();
        if (now < lockStatus.lockedUntil) {
          const minutesRemaining = Math.ceil(
            (lockStatus.lockedUntil.getTime() - now.getTime()) / 60000
          );

          await recordLoginAttempt(
            identifier,
            role,
            "failed",
            "account_locked"
          );

          await logAction({
            userId: identifier,
            userRole: role,
            action: "login_failed",
            details: `Account locked for ${minutesRemaining} more minutes`,
            status: "failure",
          });

          return {
            success: false,
            message: `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
          };
        }
      }
    }

    // Verify password using bcrypt hash
    // First check if password_hash exists (new secure format)
    let passwordValid = false;
    if (data.password_hash) {
      passwordValid = await verifyPassword(password, data.password_hash);
    } else if (data.password) {
      // Fallback for old plaintext passwords (migrate on next login)
      passwordValid = data.password === password;
      if (passwordValid) {
        console.warn(`User ${identifier} still has plaintext password. Consider migrating.`);
      }
    }

    if (!passwordValid) {
      // Record failed login attempt
      const attemptResult = await recordLoginAttempt(
        identifier,
        role,
        "failed",
        "invalid_password"
      );

      // Log audit
      await supabase.from("login_audit").insert({
        user_id: data[userIdField],
        user_role: role,
        login_status: "failed_password",
        mfa_verified: false,
      });

      await logAction({
        userId: identifier,
        userRole: role,
        action: "login_failed",
        details: `Invalid password (attempt ${attemptResult.failedCount}/5)`,
        status: "failure",
      });

      if (attemptResult.shouldLock && attemptResult.lockedUntil) {
        return {
          success: false,
          message: "Account locked due to too many failed login attempts. Please try again in 3 minutes.",
        };
      }

      const attemptsRemaining = 5 - attemptResult.failedCount;
      return {
        success: false,
        message: `Invalid credentials. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining before account lockout.`,
      };
    }

    // Password is valid - check for expiry
    const isExpired = isPasswordExpired(data.password_changed_at);
    if (isExpired) {
      await logAction({
        userId: identifier,
        userRole: role,
        action: "password_expired_login",
        details: "User login redirected to password change due to expiry",
        status: "success",
      });

      // Remove sensitive data
      const { password_hash, password: _dbPassword, ...userSafeData } = data;

      return {
        success: true,
        message: "Your password has expired. Please update it.",
        requiresPasswordChange: true,
        user: userSafeData,
        role,
      };
    }

    // Password is valid - record successful attempt and clear locks
    await recordLoginAttempt(
      identifier,
      role,
      "success"
    );

    // Also reset old login attempts columns for backward compatibility
    await supabase
      .from(table)
      .update({
        login_attempts: 0,
        is_locked: false,
      })
      .eq(idField, identifier);

    // Check if MFA is enabled
    const isMFAEnabled = data.is_mfa_enabled !== false; // Default to true

    if (isMFAEnabled) {
      // Generate OTP and send via email
      const otp = generateOTP();
      const otpHash = hashOTP(otp);
      const expiryTime = generateOTPExpiry();

      // Store OTP in database
      const { error: otpError } = await supabase.from("otp_logs").insert({
        user_id: data[userIdField],
        user_role: role,
        otp_hash: otpHash,
        expires_at: expiryTime.toISOString(),
        attempts: 0,
      });

      if (otpError) {
        console.error("Error storing OTP:", otpError);
        return {
          success: false,
          message: "Error generating OTP. Please try again.",
        };
      }

      // Send OTP email
      const emailSent = await sendOTPEmail(
        data.email,
        otp,
        `${data.first_name || data.firstName} ${data.last_name || data.lastName}`
      );

      if (!emailSent) {
        // Log the failure but DON'T block login - OTP is logged to console in dev mode
        await logAction({
          userId: identifier,
          userRole: role,
          action: "otp_send_failed",
          details: "Failed to send OTP email - check console for OTP code",
          status: "warning",
        });
        console.warn("⚠️ Email failed but continuing to OTP form. Check console for OTP code.");
      }

      // Log audit
      await supabase.from("login_audit").insert({
        user_id: data[userIdField],
        user_role: role,
        login_status: "success",
        mfa_verified: false,
      });

      // Create a temporary token for MFA verification (JWT-like)
      const mfaToken = Buffer.from(JSON.stringify({ userId: data[userIdField], role, timestamp: Date.now() })).toString("base64");

      await logAction({
        userId: identifier,
        userRole: role,
        action: "otp_sent",
        details: "OTP sent to registered email",
        status: "success",
      });

      // Remove sensitive data
      const { password_hash, password: _dbOldPassword, ...userSafeData } = data;

      return {
        success: true,
        message: "OTP sent to your email",
        requiresMFA: true,
        mfaToken,
        user: userSafeData,
        role,
      };
    }

    // MFA disabled - login successful
    await supabase.from("login_audit").insert({
      user_id: data[userIdField],
      user_role: role,
      login_status: "success",
      mfa_verified: true,
    });

    await logAction({
      userId: identifier,
      userRole: role,
      action: "login_success",
      details: "User logged in successfully",
      status: "success",
    });

    // Update last login time
    await supabase
      .from(table)
      .update({
        last_login: new Date().toISOString(),
      })
      .eq(idField, identifier);

    // Remove sensitive data
    const { password_hash, password: _dbPassword, ...userWithoutPassword } = data;

    return {
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      role,
    };
  } catch (error) {
    console.error("Login error:", error);
    await logAction({
      userId: identifier,
      userRole: role,
      action: "login_error",
      details: `Login error: ${error}`,
      status: "failure",
    });
    return { success: false, message: "An error occurred during login" };
  }
}

/**
 * Update user password with complexity and rotation checks
 */
export async function updatePassword(
  identifier: string,
  oldPassword: string,
  newPassword: string,
  role: UserRole
): Promise<LoginResult> {
  try {
    // 1. Determine table and fields
    let table: string;
    let idField: string;
    let userIdField: string;

    switch (role) {
      case "admin":
        table = "admins";
        idField = "id";
        userIdField = "id";
        break;
      case "patient":
        table = "patients";
        idField = "patient_id";
        userIdField = "patient_id";
        break;
      case "doctor":
        table = "doctors";
        idField = "doctor_id";
        userIdField = "doctor_id";
        break;
      case "nurse":
        table = "nurses";
        idField = "nurse_id";
        userIdField = "nurse_id";
        break;
      case "staff":
        table = "staff";
        idField = "staff_id";
        userIdField = "staff_id";
        break;
      default:
        return { success: false, message: "Invalid role" };
    }

    // 2. Get user data (including current hash)
    const { data: user, error: userError } = await supabase
      .from(table)
      .select("*")
      .eq(idField, identifier)
      .single();

    if (userError || !user) {
      return { success: false, message: "User not found" };
    }

    // 3. Verify old password
    let oldPasswordValid = false;
    if (user.password_hash) {
      oldPasswordValid = await verifyPassword(oldPassword, user.password_hash);
    } else if (user.password) {
      // Fallback for old plaintext passwords
      oldPasswordValid = user.password === oldPassword;
    }

    if (!oldPasswordValid) {
      await logAction({
        userId: identifier,
        userRole: role,
        action: "password_change_failed",
        details: "Invalid old password provided",
        status: "failure",
      });
      return { success: false, message: "Incorrect current password" };
    }

    // 4. Validate new password complexity
    const complexityResult = validatePasswordComplexity(newPassword);
    if (!complexityResult.valid) {
      return { success: false, message: complexityResult.message || "Invalid password format" };
    }

    // 5. Check password history (prevent reuse of last 3 passwords)
    const { data: history } = await supabase
      .from("password_history")
      .select("password_hash")
      .eq("user_id", user[userIdField])
      .eq("user_role", role)
      .order("changed_at", { ascending: false })
      .limit(3);

    if (history) {
      for (const record of history) {
        const matches = await verifyPassword(newPassword, record.password_hash);
        if (matches) {
          return {
            success: false,
            message: "Cannot reuse one of your last 3 passwords",
          };
        }
      }
    }

    // 6. Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // 7. Update user table - set both password_hash and password (for compatibility)
    const { error: updateError } = await supabase
      .from(table)
      .update({
        password_hash: newPasswordHash,
        password: newPasswordHash, // Some tables have NOT NULL on password column
        password_changed_at: new Date().toISOString(),
      })
      .eq(idField, identifier);

    if (updateError) {
      throw updateError;
    }

    // 8. Record in history
    await supabase.from("password_history").insert({
      user_id: user[userIdField],
      user_role: role,
      password_hash: newPasswordHash,
    });

    // 9. Log success
    await logAction({
      userId: identifier,
      userRole: role,
      action: "password_change_success",
      details: "Password updated successfully",
      status: "success",
    });

    const { password_hash, password: _dbPassword, ...userSafeData } = user;

    return {
      success: true,
      message: "Password updated successfully",
      user: userSafeData,
      role,
    };
  } catch (error) {
    console.error("Password update error:", error);
    return { success: false, message: "Failed to update password. Please try again." };
  }
}

/**
 * Verify OTP code for MFA
 */
export async function verifyMFAOTP(
  mfaToken: string,
  otpCode: string,
  role: UserRole
): Promise<OTPVerifyResult> {
  try {
    // Decode MFA token
    let tokenData: any;
    try {
      tokenData = JSON.parse(Buffer.from(mfaToken, "base64").toString());
    } catch (e) {
      return { success: false, message: "Invalid verification token" };
    }

    const { userId } = tokenData;

    // Determine the table based on role
    let table: string;
    let idField: string;

    switch (role) {
      case "admin":
        table = "admins";
        idField = "id";
        break;
      case "patient":
        table = "patients";
        idField = "patient_id";
        break;
      case "doctor":
        table = "doctors";
        idField = "doctor_id";
        break;
      case "nurse":
        table = "nurses";
        idField = "nurse_id";
        break;
      case "staff":
        table = "staff";
        idField = "staff_id";
        break;
      default:
        return { success: false, message: "Invalid role" };
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from(table)
      .select("*")
      .eq(idField, userId)
      .single();

    if (userError || !userData) {
      return { success: false, message: "User not found" };
    }

    // Get latest OTP record
    console.log(`🔍 Looking for OTP record: user_id=${userId}, role=${role}`);

    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("user_role", role)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    console.log(`📋 OTP Query result:`, { otpRecord, otpError });

    if (otpError || !otpRecord) {
      console.log(`❌ No OTP found for user. Error:`, otpError);
      await logAction({
        userId: userId,
        userRole: role,
        action: "otp_verification_failed",
        details: `No valid OTP found. Query: user_id=${userId}, role=${role}`,
        status: "failure",
      });
      return { success: false, message: "No valid OTP found. Request a new one." };
    }

    // Check if OTP has expired
    const now = new Date();
    const expiryTime = new Date(otpRecord.expires_at);
    if (now > expiryTime) {
      await logAction({
        userId: userId,
        userRole: role,
        action: "otp_verification_failed",
        details: "OTP expired",
        status: "failure",
      });
      return { success: false, message: "OTP has expired. Request a new one." };
    }

    // Check maximum attempts
    if ((otpRecord.attempts || 0) >= 5) {
      // Delete expired OTP
      await supabase
        .from("otp_logs")
        .delete()
        .eq("id", otpRecord.id);

      await logAction({
        userId: userId,
        userRole: role,
        action: "otp_verification_failed",
        details: "Maximum OTP attempts exceeded",
        status: "failure",
      });
      return {
        success: false,
        message: "Maximum OTP attempts exceeded. Request a new OTP.",
      };
    }

    // Verify OTP (hash and compare)
    const otpHash = hashOTP(otpCode);
    const otpMatches = otpHash === otpRecord.otp_hash;

    if (!otpMatches) {
      // Increment attempts
      await supabase
        .from("otp_logs")
        .update({
          attempts: (otpRecord.attempts || 0) + 1,
        })
        .eq("id", otpRecord.id);

      await logAction({
        userId: userId,
        userRole: role,
        action: "otp_verification_failed",
        details: `Invalid OTP (attempt ${(otpRecord.attempts || 0) + 1}/5)`,
        status: "failure",
      });
      return { success: false, message: "Invalid OTP. Please try again." };
    }

    // OTP is valid - mark as verified
    await supabase
      .from("otp_logs")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", otpRecord.id);

    // Update last login
    await supabase
      .from(table)
      .update({
        last_login: new Date().toISOString(),
      })
      .eq(idField, userId);

    // Log audit
    await supabase.from("login_audit").insert({
      user_id: userId,
      user_role: role,
      login_status: "success",
      mfa_verified: true,
    });

    await logAction({
      userId: userId,
      userRole: role,
      action: "otp_verified",
      details: "OTP verified successfully",
      status: "success",
    });

    // Remove sensitive data
    const { password_hash, password: _dbPassword, ...userWithoutPassword } = userData;

    return {
      success: true,
      message: "MFA verification successful",
      user: userWithoutPassword,
      role,
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return { success: false, message: "Error verifying OTP. Please try again." };
  }
}
