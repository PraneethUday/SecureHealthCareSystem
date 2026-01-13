import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

console.log("[supabase] env", {
	supabaseUrl,
	supabaseAnonKey: supabaseAnonKey?.slice(0, 6),
});

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const createServerClient = () =>
	createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: false,
		},
	});

export const supabaseServer = createServerClient();
