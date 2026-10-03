import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { totp } from "./totp";

export const SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const ANON_KEY =
  process.env.TEST_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
export const SERVICE_KEY =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
export const APP_URL = process.env.TEST_APP_URL ?? "http://localhost:3100";

// Seeded users (supabase/seeds + scripts/seed-clinical.ts)
export const USERS = {
  P001: { email: "arun.k@email.com", password: "patient1", role: "patient" },
  P002: { email: "meera.s@email.com", password: "patient2", role: "patient" },
  P003: { email: "venkatesh.r@email.com", password: "patient3", role: "patient" },
  D001: { email: "dr.rajesh.k@apollo.com", password: "doctor1", role: "doctor" },
  D004: { email: "dr.lakshmi.s@fortis.com", password: "doctor4", role: "doctor" },
  N001: { email: "malathi.v@apollo.com", password: "nurse1", role: "nurse" },
  N004: { email: "tamilselvi.k@fortis.com", password: "nurse4", role: "nurse" },
  S001: { email: "kumaran.s@apollo.com", password: "staff1", role: "staff" },
  ADMIN: { email: "admin@securehealthcare.com", password: "admin123", role: "admin" },
} as const;
export type TestUser = keyof typeof USERS;

export interface Session {
  client: SupabaseClient;
  cookieHeader: () => string;
  /** fetch against the Next.js app carrying this session's cookies */
  api: (path: string, init?: RequestInit) => Promise<Response>;
  factorId?: string;
  signOut: () => Promise<void>;
}

export const admin = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

/**
 * Sign in the way the browser does (cookie session via @supabase/ssr) and,
 * when mfa is true, enrol + verify a TOTP factor so the session is aal2.
 */
export async function signIn(user: TestUser, opts: { mfa?: boolean } = {}): Promise<Session> {
  const jar = new Map<string, string>();
  const client = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (c) => c.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { email, password } = USERS[user];
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${user}: ${error.message}`);

  let factorId: string | undefined;
  if (opts.mfa) {
    // Start from a clean slate: remove factors left by earlier runs or by a
    // browser enrolment (a user can't drop a verified factor at aal1).
    const { data: factors } = await client.auth.mfa.listFactors();
    const {
      data: { user: me },
    } = await client.auth.getUser();
    for (const f of factors?.all ?? []) {
      await admin().auth.admin.mfa.deleteFactor({ id: f.id, userId: me!.id });
    }
    const { data: f, error: enrollError } = await client.auth.mfa.enroll({ factorType: "totp" });
    if (enrollError) throw enrollError;
    factorId = f.id;
    const v = await client.auth.mfa.challengeAndVerify({ factorId: f.id, code: totp(f.totp.secret) });
    if (v.error) throw v.error;
  }

  const cookieHeader = () => [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
  return {
    client,
    cookieHeader,
    factorId,
    api: (path, init) =>
      fetch(`${APP_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", cookie: cookieHeader(), ...(init?.headers ?? {}) },
      }),
    signOut: async () => {
      if (factorId) await client.auth.mfa.unenroll({ factorId });
      await client.auth.signOut();
    },
  };
}
