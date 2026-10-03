// Stand-in for "@/lib/supabase/server" in API route unit tests. It keeps the
// real guard() semantics (401 when signed out, 403 on role mismatch or a
// missing aal2 session) while letting each test choose the caller and the
// Supabase client that caller's queries hit.
//
//   jest.mock("@/lib/supabase/server", () => require("../helpers/serverAuthMock"));
//   import { setCurrentUser } from "../helpers/serverAuthMock";

const MFA_ROLES = ["doctor", "nurse", "staff", "admin"];

let current: any = null;

export function setCurrentUser(
  user:
    | null
    | {
        role: string;
        profileId?: string;
        businessId?: string;
        aal?: "aal1" | "aal2";
        supabase?: any;
      },
) {
  current = user
    ? {
        profileId: `${user.role}-uuid`,
        businessId: `${user.role.toUpperCase()}001`,
        aal: "aal2",
        authUser: { id: "auth-uid" },
        supabase: {},
        ...user,
      }
    : null;
}

export class AuthError extends Error {
  constructor(message: string, public status: 401 | 403) {
    super(message);
  }
}

export async function getCurrentUser() {
  return current;
}

export async function requireUser(...roles: string[]) {
  if (!current) throw new AuthError("Not signed in", 401);
  if (roles.length && !roles.includes(current.role)) throw new AuthError("Forbidden", 403);
  if (MFA_ROLES.includes(current.role) && current.aal !== "aal2") {
    throw new AuthError("Multi-factor authentication required", 403);
  }
  return current;
}

export function authErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  throw err;
}

export async function guard(...roles: string[]) {
  try {
    return await requireUser(...roles);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function createServerSupabase() {
  return current?.supabase ?? {};
}
