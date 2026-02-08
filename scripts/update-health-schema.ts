import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
    console.log("🚀 Updating database schema...");

    const sql = `
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_profile JSONB;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS share_health_profile BOOLEAN DEFAULT false;
  `;

    try {
        const { error } = await supabase.rpc("exec_sql", { sql });

        if (error) {
            // If RPC fails, it might be because exec_sql doesn't exist.
            // We'll try a fallback if possible, but usually in these templates it exists.
            console.error("❌ Error updating schema:", error.message);
            console.log("Attempting fallback: This might require manual execution in Supabase SQL Editor.");
        } else {
            console.log("✅ Schema updated successfully!");
        }
    } catch (err: any) {
        console.error("❌ Unexpected error:", err.message);
    }
}

updateSchema();
