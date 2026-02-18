/**
 * Account Lockout Helper Functions
 * Centralized security system for tracking login attempts and managing account locks
 */

import { supabaseAdmin as supabase } from "./supabase-admin";
import { UserRole } from "./database.types";

interface LockStatus {
    isLocked: boolean;
    lockedUntil?: Date;
    failedAttempts: number;
    lockReason?: string;
    isManuallyLocked?: boolean;
}

interface LoginAttemptResult {
    shouldLock: boolean;
    failedCount: number;
    lockedUntil?: Date;
}

/**
 * Check if an account is currently locked
 */
export async function checkAccountLock(
    userId: string,
    userRole: UserRole
): Promise<LockStatus> {
    try {
        const { data, error } = await supabase.rpc("is_account_locked", {
            p_user_id: userId,
            p_user_role: userRole,
        });

        if (error) {
            console.error("Error checking account lock:", error);
            return { isLocked: false, failedAttempts: 0 };
        }

        if (!data || data.length === 0) {
            return { isLocked: false, failedAttempts: 0 };
        }

        const lockInfo = data[0];
        return {
            isLocked: lockInfo.is_locked || false,
            lockedUntil: lockInfo.locked_until ? new Date(lockInfo.locked_until) : undefined,
            failedAttempts: lockInfo.failed_attempts || 0,
            lockReason: lockInfo.lock_reason,
            isManuallyLocked: lockInfo.is_manually_locked || false,
        };
    } catch (err) {
        console.error("Exception checking account lock:", err);
        return { isLocked: false, failedAttempts: 0 };
    }
}

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(
    userId: string,
    userRole: UserRole,
    attemptType: "success" | "failed",
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string
): Promise<LoginAttemptResult> {
    try {
        const { data, error } = await supabase.rpc("record_login_attempt", {
            p_user_id: userId,
            p_user_role: userRole,
            p_attempt_type: attemptType,
            p_failure_reason: failureReason,
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
        });

        if (error) {
            console.error("Error recording login attempt:", error);
            return { shouldLock: false, failedCount: 0 };
        }

        if (!data || data.length === 0) {
            return { shouldLock: false, failedCount: 0 };
        }

        const result = data[0];
        return {
            shouldLock: result.should_lock || false,
            failedCount: result.failed_count || 0,
            lockedUntil: result.locked_until ? new Date(result.locked_until) : undefined,
        };
    } catch (err) {
        console.error("Exception recording login attempt:", err);
        return { shouldLock: false, failedCount: 0 };
    }
}

/**
 * Admin function to unlock an account
 */
export async function adminUnlockAccount(
    userId: string,
    userRole: UserRole,
    adminId: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc("admin_unlock_account", {
            p_user_id: userId,
            p_user_role: userRole,
            p_admin_id: adminId,
        });

        if (error) {
            console.error("Error unlocking account:", error);
            return false;
        }

        return data === true;
    } catch (err) {
        console.error("Exception unlocking account:", err);
        return false;
    }
}

/**
 * Admin function to manually lock an account
 */
export async function adminLockAccount(
    userId: string,
    userRole: UserRole,
    adminId: string,
    reason?: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc("admin_lock_account", {
            p_user_id: userId,
            p_user_role: userRole,
            p_admin_id: adminId,
            p_reason: reason || "Manually locked by administrator",
        });

        if (error) {
            console.error("Error locking account:", error);
            return false;
        }

        return data === true;
    } catch (err) {
        console.error("Exception locking account:", err);
        return false;
    }
}

/**
 * Get recent failed login attempts count
 */
export async function getRecentFailedAttempts(
    userId: string,
    userRole: UserRole,
    minutes: number = 15
): Promise<number> {
    try {
        const { data, error } = await supabase.rpc("get_recent_failed_attempts", {
            p_user_id: userId,
            p_user_role: userRole,
            p_minutes: minutes,
        });

        if (error) {
            console.error("Error getting failed attempts:", error);
            return 0;
        }

        return data || 0;
    } catch (err) {
        console.error("Exception getting failed attempts:", err);
        return 0;
    }
}

/**
 * Get all locked accounts (admin only)
 */
export async function getLockedAccounts() {
    try {
        const { data, error } = await supabase
            .from("account_locks")
            .select("*")
            .or("locked_until.gt.now(),is_manually_locked.eq.true")
            .order("locked_at", { ascending: false });

        if (error) {
            console.error("Error fetching locked accounts:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Exception fetching locked accounts:", err);
        return [];
    }
}

/**
 * Get login attempt history for a user (admin only)
 */
export async function getUserLoginHistory(
    userId: string,
    userRole: UserRole,
    limit: number = 50
) {
    try {
        const { data, error } = await supabase
            .from("login_attempts")
            .select("*")
            .eq("user_id", userId)
            .eq("user_role", userRole)
            .order("attempted_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Error fetching login history:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Exception fetching login history:", err);
        return [];
    }
}

/**
 * Format lock duration for display
 */
export function formatLockDuration(lockedUntil: Date): string {
    const now = new Date();
    const diff = lockedUntil.getTime() - now.getTime();

    if (diff <= 0) {
        return "Lock expired";
    }

    const minutes = Math.ceil(diff / 60000);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }

    return `${hours} hour${hours !== 1 ? "s" : ""} ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
}
