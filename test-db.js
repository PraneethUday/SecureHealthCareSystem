require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("URI", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: admins, error: e1 } = await supabase.from('admins').select('*');
    console.log("Admins:", admins ? admins.length : e1);

    const { data: patients, error: e2 } = await supabase.from('patients').select('*');
    console.log("Patients:", patients ? patients.length : e2);
}
check();
