import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Keystore } from "./clinical";

// One keystore per server process; KEKs are fetched from Vault on demand.
export const keystore = new Keystore(supabaseAdmin);
