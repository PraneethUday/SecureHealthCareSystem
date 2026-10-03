import { UserRole } from "./database.types";
import { supabase } from "./supabase";

// The Supabase Auth session (in cookies) is what actually authenticates the
// user; RLS decides what they can read. This sessionStorage entry is only a
// cache of the profile for rendering, so editing it grants nothing.

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

export async function clearSession(): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    await supabase.auth.signOut();
  }
}
