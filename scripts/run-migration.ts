import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Adding columns manually via RPC if possible...");

    const queries = [
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_profile JSONB;",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS share_health_profile BOOLEAN DEFAULT false;"
    ];

    for (const sql of queries) {
        console.log(`Executing: ${sql}`);
        const { error } = await supabase.rpc("exec_sql", { sql });
        if (error) {
            console.error(`Error executing SQL: ${error.message}`);
        } else {
            console.log("Success!");
        }
    }

    // Double check patients table after run
    const { data, error } = await supabase.from("patients").select("*").limit(1);
    if (data && data.length > 0) {
        console.log("Patient columns now:", Object.keys(data[0]));
    }
}

run();
