require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyQueryLogic() {
    console.log("🔍 Verifying Patient Access Log Query Logic");

    const patientId = "dae972f7-e25f-4632-9571-042857476834"; // Default seeded patient ID

    // 1. Fetch Patient Records
    console.log(`\nFetching records for patient: ${patientId}`);
    const { data: records, error: rErr } = await supabase
        .from("medical_records")
        .select("id")
        .eq("patient_id", patientId);

    if (rErr) console.error("Error fetching records:", rErr);
    console.log(`Found ${records?.length || 0} medical records.`);

    // 2. Fetch Patient Prescriptions
    const { data: prescriptions, error: pErr } = await supabase
        .from("prescriptions")
        .select("id")
        .eq("patient_id", patientId);

    if (pErr) console.error("Error fetching prescriptions:", pErr);
    console.log(`Found ${prescriptions?.length || 0} prescriptions.`);

    // 3. Build related IDs
    const relatedIds = [
        patientId,
        ...(records?.map(r => r.id) || []),
        ...(prescriptions?.map(p => p.id) || [])
    ];
    console.log(`\nChecking logs for ${relatedIds.length} related resource IDs...`);

    // 4. Query Logs
    const { data: logs, error: lErr } = await supabase
        .from("access_logs")
        .select("*")
        .in("resource_id", relatedIds)
        .order("timestamp", { ascending: false });

    if (lErr) {
        console.error("❌ Log query failed:", lErr);
    } else {
        console.log(`\n✅ Query Successful! Found ${logs.length} related logs.`);
        if (logs.length > 0) {
            console.log("Sample Log:", JSON.stringify(logs[0], null, 2));
            const listViews = logs.filter(l => l.resource_id === patientId).length;
            const recordViews = logs.filter(l => l.resource_type === 'medical_record' && l.resource_id !== patientId).length;
            console.log(`\nSummary:`);
            console.log(`- List Views (Patient Dashboard): ${listViews}`);
            console.log(`- Specific Record Views: ${recordViews}`);
        } else {
            console.warn("\n⚠️ No logs found. Try performing some actions in the app first.");
        }
    }
}

verifyQueryLogic();
