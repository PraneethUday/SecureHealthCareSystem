import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ROLE_TABLES, MFA_REQUIRED_ROLES } from "@/lib/auth-provisioning";
import type { UserRole } from "@/lib/database.types";

/**
 * Per-request Supabase client acting as the signed-in user (session read
 * from cookies). Every query is subject to RLS for that user, which is the
 * point: route handlers should do data access through this client, never
 * through the service role, unless the operation is genuinely privileged.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

export interface CurrentUser {
  authUser: User;
  role: UserRole;
  /** Primary key (id) of the row in the role table. */
  profileId: string;
  /** Business identifier: patient_id / doctor_id / nurse_id / staff_id. */
  businessId: string;
  /** Authenticator assurance level of this session. */
  aal: "aal1" | "aal2";
  supabase: SupabaseClient;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403,
  ) {
    super(message);
  }
}

/**
 * Resolve the caller from the session cookie. The role comes from which
 * role table the auth user is linked to, never from anything the client
 * sends.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  for (const role of Object.keys(ROLE_TABLES) as UserRole[]) {
    const { table, businessIdField } = ROLE_TABLES[role];
    const { data } = await supabaseAdmin
      .from(table)
      .select(`id, ${businessIdField}`)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (data) {
      const row = data as unknown as Record<string, string>;
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      return {
        authUser: user,
        role,
        profileId: String(row.id),
        businessId: String(row[businessIdField]),
        aal: aal?.currentLevel === "aal2" ? "aal2" : "aal1",
        supabase,
      };
    }
  }
  return null;
}

/**
 * Like getCurrentUser, but throws AuthError unless the caller has one of the
 * given roles (and, for roles that require it, a TOTP-verified session).
 */
export async function requireUser(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not signed in", 401);
  if (roles.length && !roles.includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  if (MFA_REQUIRED_ROLES.includes(user.role) && user.aal !== "aal2") {
    throw new AuthError("Multi-factor authentication required", 403);
  }
  return user;
}

/** Map AuthError to a JSON response; rethrow anything else. */
export function authErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  throw err;
}

/**
 * Route-handler guard. Returns the caller, or a 401/403 Response to return
 * as-is:
 *   const auth = await guard("admin");
 *   if (auth instanceof Response) return auth;
 */
export async function guard(...roles: UserRole[]): Promise<CurrentUser | Response> {
  try {
    return await requireUser(...roles);
  } catch (err) {
    return authErrorResponse(err);
  }
}
