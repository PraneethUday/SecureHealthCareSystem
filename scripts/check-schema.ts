import { supabase } from "../lib/supabase";

async function addMissingColumns() {
  try {
    console.log("🔧 Adding missing columns to patients table...\n");

    // First, let's check if the columns exist
    const { data: existingPatients, error: fetchError } = await supabase
      .from("patients")
      .select("*")
      .limit(1);

    if (fetchError) {
      console.error("❌ Error fetching patients:", fetchError);
      return;
    }

    console.log(
      "Current patient table columns:",
      existingPatients && existingPatients[0]
        ? Object.keys(existingPatients[0])
        : "No patients found"
    );
    console.log("\n📝 Required columns:");
    console.log("  - phone_number");
    console.log("  - gender");
    console.log("  - emergency_contact");
    console.log("  - blood_group");
    console.log(
      "\n⚠️  You need to manually add these columns in Supabase SQL Editor:"
    );
    console.log("\nRun these SQL commands:");
    console.log("-----------------------------------");
    console.log(
      "ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT;"
    );
    console.log("ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;");
    console.log(
      "ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;"
    );
    console.log(
      "ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT;"
    );
    console.log("-----------------------------------\n");

    console.log("📍 Steps:");
    console.log("1. Go to https://supabase.com/dashboard");
    console.log("2. Select your project");
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log("4. Create a new query and paste the SQL commands above");
    console.log('5. Click "Run"\n');
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addMissingColumns();
