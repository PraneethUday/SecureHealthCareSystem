import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Note: SUPABASE_SERVICE_ROLE_KEY should only be used in server-side contexts
// Lazy initialization to avoid build errors when env vars are not available
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

// Export as a getter to ensure lazy initialization
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});
