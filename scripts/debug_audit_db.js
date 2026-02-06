
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Load from .env.local
dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const patientId = "P005";
    console.log(`🔍 inspecting for Patient ID: ${patientId}`);

    // 1. Resolve Patient
    console.log("--- PATIENT LOOKUP ---");
    // Try 'patients' table (or profiles depending on schema)
    // We suspect 'patients' table exists because previous code used it.
    const { data: patients, error: pError } = await supabase
        .from("patients")
        .select("*")
        .or(`id.eq.${patientId},patient_id.eq.${patientId}`);

    if (pError) console.error("Patient Error:", pError);
    console.log("Found Patients:", patients);

    let pUuid = patientId;
    let pReadable = patientId;

    if (patients && patients.length > 0) {
        pUuid = patients[0].id;
        pReadable = patients[0].patient_id;
        console.log(`Resolved -> UUID: ${pUuid}, Readable: ${pReadable}`);
    }

    // 2. Check Medical Reports
    console.log("\n--- MEDICAL REPORTS CHECK ---");
    // Try finding reports by UUID
    const { data: reportsUUID, error: rErrorUUID } = await supabase
        .from("medical_reports")
        .select("id, patient_id, report_name")
        .eq("patient_id", pUuid);
    console.log(`Reports by UUID (${pUuid}):`, reportsUUID ? reportsUUID.length : 0);
    if (reportsUUID && reportsUUID.length > 0) console.log(reportsUUID);

    // Try finding reports by Readable ID
    const { data: reportsReadable, error: rErrorReadable } = await supabase
        .from("medical_reports")
        .select("id, patient_id, report_name")
        .eq("patient_id", pReadable);
    console.log(`Reports by Readable (${pReadable}):`, reportsReadable ? reportsReadable.length : 0);
    if (reportsReadable && reportsReadable.length > 0) console.log(reportsReadable);

    // 3. Check Access Logs
    console.log("\n--- ACCESS LOGS CHECK ---");
    const { data: logs } = await supabase
        .from("access_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(5);

    console.log("Recent 5 Logs:", logs ? logs.map(l => ({
        action: l.action,
        res_type: l.resource_type,
        res_id: l.resource_id,
        time: l.timestamp
    })) : "No logs found");
}

main();
