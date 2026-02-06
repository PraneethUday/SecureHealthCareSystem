import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Hash a password using bcrypt with salt rounds
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong salt rounds for security
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to check
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a 6-digit OTP code
 * @returns string - 6-digit OTP
 */
export function generateOTP(): string {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

/**
 * Generate OTP expiry timestamp (valid for 10 minutes)
 * @returns Date - Expiry timestamp
 */
export function generateOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // OTP valid for 10 minutes
  return expiry;
}

/**
 * Check if OTP has expired
 * @param expiryTime - OTP expiry timestamp
 * @returns boolean - True if OTP is still valid
 */
export function isOTPValid(expiryTime: Date): boolean {
  return new Date() < expiryTime;
}

/**
 * Generate a secure token for password reset or email verification
 * @returns string - Secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash OTP for storage (additional security layer)
 * @param otp - Plain text OTP
 * @returns string - Hashed OTP
 */
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Verify OTP by comparing plain text with hashed version
 * @param otp - Plain text OTP from user
 * @param hashedOTP - Hashed OTP from database
 * @returns boolean - True if OTP matches
 */
export function verifyOTP(otp: string, hashedOTP: string): boolean {
  const hashedInput = hashOTP(otp);
  return hashedInput === hashedOTP;
}

/**
 * Validates password complexity
 * Rules: Min 12 chars, 1 Uppercase, 1 Lowercase, 1 Number, 1 Special character
 */
export function validatePasswordComplexity(password: string): {
  valid: boolean;
  message?: string;
} {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long`,
    };
  }
  if (!hasUppercase) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!hasLowercase) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!hasNumber) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (!hasSpecial) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { valid: true };
}

/**
 * Checks if a password has expired (older than 90 days)
 */
export function isPasswordExpired(changedAt: string | null): boolean {
  if (!changedAt) return true; // Force change if never recorded

  const lastChanged = new Date(changedAt);
  const now = new Date();
  const diffInDays = (now.getTime() - lastChanged.getTime()) / (1000 * 3600 * 24);

  return diffInDays > 90;
}
