"use server";

import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { ROLE_TABLES, MFA_REQUIRED_ROLES } from "@/lib/auth-provisioning";
import { UserRole } from "@/lib/database.types";
import { logAction } from "@/lib/logging";
import {
  verifyPassword,
  isPasswordExpired,
  validatePasswordComplexity,
  hashPassword,
} from "@/lib/security";
import { checkAccountLock, recordLoginAttempt } from "@/lib/account-lockout";

// Columns safe to hand back to the browser for display.
const PROFILE_OMIT = [
  "password",
  "password_hash",
  "password_reset_token",
  "password_reset_expires_at",
  "reset_token",
  "reset_token_expiry",
  "mfa_secret",
];

function publicProfile(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).filter(([k]) => !PROFILE_OMIT.includes(k)),
  );
}

interface LoginResult {
  success: boolean;
  message: string;
  user?: any;
  role?: UserRole;
  /** A TOTP factor is enrolled: verify a code before continuing. */
  requiresMFA?: boolean;
  /** Role requires MFA but no factor is enrolled yet: go to enrolment. */
  requiresMFAEnrollment?: boolean;
  requiresPasswordChange?: boolean;
}

export async function login(
  identifier: string,
  password: string,
  role: UserRole,
): Promise<LoginResult> {
  const config = ROLE_TABLES[role];
  if (!config) return { success: false, message: "Invalid role selected" };

  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq(config.loginField, identifier)
    .maybeSingle();

  if (error || !data) {
    await recordLoginAttempt(identifier, role, "failed", "user_not_found");
    await logAction({
      userId: identifier,
      userRole: role,
      action: "login_failed",
      details: "Invalid credentials",
      status: "failure",
    });
    return {
      success: false,
      message:
        role === "patient"
          ? "Account not found. Please create an account if you are a new user."
          : "Invalid credentials",
    };
  }

  const businessId = String(data[config.businessIdField]);

  const lockStatus = await checkAccountLock(identifier, role);
  if (lockStatus.isLocked) {
    if (lockStatus.isManuallyLocked) {
      await recordLoginAttempt(identifier, role, "failed", "account_locked_by_admin");
      await logAction({
        userId: identifier,
        userRole: role,
        action: "login_failed",
        details: "Account manually locked by administrator",
        status: "failure",
      });
      return {
        success: false,
        message:
          "Your account has been locked by an administrator. Please contact support.",
      };
    }
    if (lockStatus.lockedUntil && new Date() < lockStatus.lockedUntil) {
      const minutesRemaining = Math.ceil(
        (lockStatus.lockedUntil.getTime() - Date.now()) / 60000,
      );
      await recordLoginAttempt(identifier, role, "failed", "account_locked");
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

  if (!data.auth_user_id) {
    // Not yet migrated to Supabase Auth (run `npm run auth:sync`).
    console.error(`Login for ${config.table}.${data.id} has no auth_user_id`);
    return {
      success: false,
      message: "Your account is being upgraded. Please contact support.",
    };
  }

  // Supabase Auth verifies the password and, on success, writes the
  // session cookie for this browser.
  const authClient = await createServerSupabase();
  const { error: signInError } = await authClient.auth.signInWithPassword({
    email: data.email,
    password,
  });

  if (signInError) {
    const attempt = await recordLoginAttempt(identifier, role, "failed", "invalid_password");
    await supabase.from("login_audit").insert({
      user_id: businessId,
      user_role: role,
      login_status: "failed_password",
      mfa_verified: false,
    });
    await logAction({
      userId: identifier,
      userRole: role,
      action: "login_failed",
      details: `Invalid password (attempt ${attempt.failedCount}/5)`,
      status: "failure",
    });
    if (attempt.shouldLock && attempt.lockedUntil) {
      return {
        success: false,
        message:
          "Account locked due to too many failed login attempts. Please try again in 3 minutes.",
      };
    }
    const remaining = 5 - attempt.failedCount;
    return {
      success: false,
      message: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before account lockout.`,
    };
  }

  await recordLoginAttempt(identifier, role, "success");
  await supabase
    .from(config.table)
    .update({ login_attempts: 0, is_locked: false, last_login: new Date().toISOString() })
    .eq("id", data.id);

  const user = publicProfile(data);

  if (role !== "admin" && isPasswordExpired(data.password_changed_at)) {
    await logAction({
      userId: identifier,
      userRole: role,
      action: "password_expired_login",
      details: "User login redirected to password change due to expiry",
      status: "success",
    });
    return {
      success: true,
      message: "Your password has expired. Please update it.",
      requiresPasswordChange: true,
      user,
      role,
    };
  }

  // TOTP: staff roles must reach aal2 before any clinical data is readable
  // (enforced in RLS). Patients may opt in; if they have, verify it too.
  const { data: aal } = await authClient.auth.mfa.getAuthenticatorAssuranceLevel();
  const hasFactor = aal?.nextLevel === "aal2";
  const mfaRequired = MFA_REQUIRED_ROLES.includes(role);

  await supabase.from("login_audit").insert({
    user_id: businessId,
    user_role: role,
    login_status: "success",
    mfa_verified: false,
  });
  await logAction({
    userId: identifier,
    userRole: role,
    action: "login_password_ok",
    details: hasFactor ? "Awaiting TOTP" : mfaRequired ? "Awaiting TOTP enrolment" : "Signed in",
    status: "success",
  });

  if (hasFactor) {
    return { success: true, message: "Enter your authenticator code", requiresMFA: true, user, role };
  }
  if (mfaRequired) {
    return {
      success: true,
      message: "Set up two-factor authentication to continue",
      requiresMFAEnrollment: true,
      user,
      role,
    };
  }
  return { success: true, message: "Login successful", user, role };
}

export async function logout(): Promise<void> {
  const authClient = await createServerSupabase();
  await authClient.auth.signOut();
}

/**
 * Update user password with complexity and rotation checks. The caller is
 * taken from the session, not from the arguments.
 */
export async function updatePassword(
  _identifier: string,
  oldPassword: string,
  newPassword: string,
  role: UserRole,
): Promise<LoginResult> {
  try {
    if (role === "admin") {
      return {
        success: false,
        message: "Admin password cannot be changed for security reasons",
      };
    }

    const authClient = await createServerSupabase();
    const {
      data: { user: authUser },
    } = await authClient.auth.getUser();
    if (!authUser?.email) return { success: false, message: "Not signed in" };

    const config = ROLE_TABLES[role];
    const { data: user } = await supabase
      .from(config.table)
      .select("*")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();
    if (!user) return { success: false, message: "User not found" };

    const identifier = String(user[config.businessIdField]);

    // Re-verify the current password against Supabase Auth.
    const { error: reauthError } = await authClient.auth.signInWithPassword({
      email: authUser.email,
      password: oldPassword,
    });
    if (reauthError) {
      await logAction({
        userId: identifier,
        userRole: role,
        action: "password_change_failed",
        details: "Invalid old password provided",
        status: "failure",
      });
      return { success: false, message: "Incorrect current password" };
    }

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.valid) {
      return { success: false, message: complexity.message || "Invalid password format" };
    }

    const { data: history } = await supabase
      .from("password_history")
      .select("password_hash")
      .eq("user_id", identifier)
      .eq("user_role", role)
      .order("changed_at", { ascending: false })
      .limit(3);
    for (const record of history ?? []) {
      if (await verifyPassword(newPassword, record.password_hash)) {
        return { success: false, message: "Cannot reuse one of your last 3 passwords" };
      }
    }

    // Change it as the user, not through the admin API: Supabase Auth keeps
    // this session and revokes the user's other sessions. (An admin password
    // update revokes every session, which silently signed the user out.)
    const { error: authUpdateError } = await authClient.auth.updateUser({ password: newPassword });
    if (authUpdateError) throw authUpdateError;

    // password_hash is kept only for the reuse check above.
    const newPasswordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from(config.table)
      .update({
        password_hash: newPasswordHash,
        password: null,
        password_changed_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) throw updateError;

    await supabase.from("password_history").insert({
      user_id: identifier,
      user_role: role,
      password_hash: newPasswordHash,
    });

    await logAction({
      userId: identifier,
      userRole: role,
      action: "password_change_success",
      details: "Password updated successfully",
      status: "success",
    });

    return {
      success: true,
      message: "Password updated successfully",
      user: publicProfile(user),
      role,
    };
  } catch (error) {
    console.error("Password update error:", error);
    return { success: false, message: "Failed to update password. Please try again." };
  }
}
