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
