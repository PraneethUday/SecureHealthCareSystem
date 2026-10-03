import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "./database.types";

// Where each role's profile lives and which column holds its login identifier.
export const ROLE_TABLES: Record<
  UserRole,
  { table: string; loginField: string; businessIdField: string }
> = {
  admin: { table: "admins", loginField: "id", businessIdField: "id" },
  patient: { table: "patients", loginField: "email", businessIdField: "patient_id" },
  doctor: { table: "doctors", loginField: "doctor_id", businessIdField: "doctor_id" },
  nurse: { table: "nurses", loginField: "nurse_id", businessIdField: "nurse_id" },
  staff: { table: "staff", loginField: "staff_id", businessIdField: "staff_id" },
};

// Roles that must pass TOTP (aal2) before touching clinical data.
export const MFA_REQUIRED_ROLES: UserRole[] = ["doctor", "nurse", "staff", "admin"];

interface ProvisionParams {
  email: string;
  role: UserRole;
  profileId: string;
  // Exactly one of these. A bcrypt hash is imported as-is, so existing
  // passwords keep working without anyone having to reset.
  password?: string;
  passwordHash?: string;
}

/**
 * Create (or find) the auth.users row for a role-table profile and link it
 * via auth_user_id. Requires a service-role client.
 */
export async function provisionAuthUser(
  admin: SupabaseClient,
  { email, role, profileId, password, passwordHash }: ProvisionParams,
): Promise<string> {
  const { table } = ROLE_TABLES[role];
  const app_metadata = { app_role: role, profile_id: profileId };

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata,
    ...(passwordHash ? { password_hash: passwordHash } : { password }),
  });

  let authUserId = created?.user?.id;

  if (error) {
    // Already exists (e.g. created by the forgot-password flow): link it.
    const existing = await findAuthUserByEmail(admin, email);
    if (!existing) throw error;
    authUserId = existing;
    await admin.auth.admin.updateUserById(existing, {
      app_metadata,
      ...(passwordHash ? { password_hash: passwordHash } : password ? { password } : {}),
    });
  }

  const { error: linkError } = await admin
    .from(table)
    .update({ auth_user_id: authUserId })
    .eq("id", profileId);
  if (linkError) throw linkError;

  return authUserId!;
}

async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
}

/** Keep the Supabase Auth password in step with a role-table password change. */
export async function syncAuthPassword(
  admin: SupabaseClient,
  role: UserRole,
  profileId: string,
  newPassword: string,
): Promise<void> {
  const { table } = ROLE_TABLES[role];
  const { data } = await admin
    .from(table)
    .select("auth_user_id")
    .eq("id", profileId)
    .single();
  if (!data?.auth_user_id) return;
  const { error } = await admin.auth.admin.updateUserById(data.auth_user_id, {
    password: newPassword,
  });
  if (error) throw error;
}
