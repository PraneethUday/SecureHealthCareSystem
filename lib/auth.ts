import { UserRole } from "./database.types";

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
