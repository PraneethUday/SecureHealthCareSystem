import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "placeholder-key";

// In the browser this client carries the signed-in user's session (stored in
// cookies so route handlers and middleware see the same session), and every
// query is filtered by RLS as that user. Server code must not use this
// export; use createServerSupabase() from lib/supabase/server instead.
export const supabase =
  typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : createBrowserClient(supabaseUrl, supabaseKey);
