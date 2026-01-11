import { supabase } from "./supabase";
import { UserRole } from "./database.types";
import { logAction } from "./logging";

interface LoginResult {
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

    switch (role) {
      case "admin":
        table = "admins";
        idField = "id";
        break;
      case "patient":
        table = "patients";
        idField = "email"; // Patients use email to login
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
        return { success: false, message: "Invalid role selected" };
    }

    // Query the database for the user
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(idField, identifier)
      .single();

    if (error || !data) {
      await logAction({
        userId: identifier,
        userRole: role,
        action: "login_failed",
        details: "Invalid credentials",
        status: "failure",
      });
      return { success: false, message: "Invalid credentials" };
    }

    // Simple password comparison (no hashing for now)
    if (data.password !== password) {
      await logAction({
        userId: identifier,
        userRole: role,
        action: "login_failed",
        details: "Invalid password",
        status: "failure",
      });
      return { success: false, message: "Invalid credentials" };
    }

    // Log successful login
    await logAction({
      userId: identifier,
      userRole: role,
      action: "login_success",
      details: "User logged in successfully",
      status: "success",
    });

    // Remove password from user data
    const { password: _, ...userWithoutPassword } = data;

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

export function saveSession(user: any, role: UserRole): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("role", role);
  }
}

export function getSession(): { user: any; role: UserRole } | null {
  if (typeof window !== "undefined") {
    const user = sessionStorage.getItem("user");
    const role = sessionStorage.getItem("role");
    if (user && role) {
      return { user: JSON.parse(user), role: role as UserRole };
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
  }
}
