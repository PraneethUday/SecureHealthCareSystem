import { UserRole } from "../types";

/**
 * Determines if the selected role requires an email or ID for login
 * @param role - The user role
 * @returns true if email is required, false if ID is required
 */
export const requiresEmail = (role: UserRole): boolean => {
  return role === "patient";
};

/**
 * Validates an employee/staff ID format
 * @param id - The ID to validate
 * @returns true if valid, false otherwise
 */
export const validateStaffId = (id: string): boolean => {
  // Example: Staff IDs should be alphanumeric and 6-12 characters
  const staffIdRegex = /^[A-Za-z0-9]{6,12}$/;
  return staffIdRegex.test(id);
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns true if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Gets the appropriate validation message based on role
 * @param role - The user role
 * @returns Validation message
 */
export const getValidationMessage = (role: UserRole): string => {
  if (requiresEmail(role)) {
    return "Please enter a valid email address";
  }
  return "Please enter a valid Staff/Employee ID (6-12 alphanumeric characters)";
};
