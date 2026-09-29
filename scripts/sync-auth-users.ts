/**
 * Link every role-table user (patients, doctors, nurses, staff, admins) to a
 * Supabase Auth user. Safe to re-run: rows that already have auth_user_id are
 * skipped.
 *
 * bcrypt hashes are imported unchanged, so users keep their current
 * password. Rows that still hold a legacy plaintext password are created
 * with that password (and should be forced through a reset).
 *
 *   npm run auth:sync            # uses .env.local, then .env
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { provisionAuthUser, ROLE_TABLES } from "../lib/auth-provisioning";
import type { UserRole } from "../lib/database.types";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Syncing auth users on ${url}`);
  let linked = 0;
  let failed = 0;

  for (const role of Object.keys(ROLE_TABLES) as UserRole[]) {
    const { table } = ROLE_TABLES[role];
    const { data: rows, error } = await admin
      .from(table)
      .select("id, email, password, password_hash")
      .is("auth_user_id", null);
    if (error) throw error;

    for (const row of rows ?? []) {
      if (!row.email) {
        console.warn(`  skip ${table}.${row.id}: no email`);
        continue;
      }
      if (!row.password_hash && !row.password) {
        console.warn(`  skip ${table}.${row.id}: no password set`);
        continue;
      }
      try {
        await provisionAuthUser(admin, {
          email: row.email,
          role,
          profileId: row.id,
          passwordHash: row.password_hash ?? undefined,
          password: row.password_hash ? undefined : row.password,
        });
        linked++;
      } catch (e) {
        failed++;
        console.error(`  failed ${table}.${row.id}:`, (e as Error).message);
      }
    }
    console.log(`  ${table}: ${rows?.length ?? 0} unlinked rows processed`);
  }

  console.log(`Done. linked=${linked} failed=${failed}`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
