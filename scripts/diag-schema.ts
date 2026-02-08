import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking patients table columns...");
    const { data, error } = await supabase.from("patients").select("*").limit(1);
    if (error) {
        console.error("Error fetching patients:", error.message);
        return;
    }
    if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("No patients found in table.");
    }

    console.log("\nChecking appointments table columns...");
    const { data: aptData, error: aptError } = await supabase.from("appointments").select("*").limit(1);
    if (aptError) {
        console.error("Error fetching appointments:", aptError.message);
    } else if (aptData && aptData.length > 0) {
        console.log("Columns found:", Object.keys(aptData[0]));
    }
}

check();
