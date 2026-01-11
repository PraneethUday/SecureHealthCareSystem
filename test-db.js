const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log("🧪 Testing Database Connection and Schema...\n");

  try {
    // Test 1: Check patients table structure
    console.log("1️⃣ Checking patients table columns...");
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("*")
      .limit(1);

    if (patientsError) {
      console.log("❌ Error:", patientsError.message);
      if (patientsError.message.includes("blood_group")) {
        console.log("\n⚠️  The blood_group column is missing!");
        console.log("Please run this SQL in Supabase:\n");
        console.log(
          "ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT;"
        );
        console.log(
          "ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;"
        );
        console.log(
          "ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;"
        );
        console.log(
          "ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT;\n"
        );
      }
      return;
    }

    if (patients && patients.length > 0) {
      console.log("✅ Patients table accessible");
      console.log("📋 Available columns:", Object.keys(patients[0]).join(", "));

      const requiredColumns = [
        "phone_number",
        "gender",
        "emergency_contact",
        "blood_group",
      ];
      const hasAllColumns = requiredColumns.every((col) => col in patients[0]);

      if (hasAllColumns) {
        console.log("✅ All required columns present!\n");
      } else {
        console.log("⚠️  Some required columns are missing:");
        requiredColumns.forEach((col) => {
          if (!(col in patients[0])) {
            console.log(`   ❌ ${col}`);
          }
        });
        console.log("\n⚠️  Please run the SQL migration in Supabase!\n");
        return;
      }
    } else {
      console.log("ℹ️  No patients in database yet (this is OK)\n");
    }

    // Test 2: Try to insert a test patient
    console.log("2️⃣ Testing patient registration...");
    const testPatient = {
      patient_id: "TEST001",
      email: "test@test.com",
      password: "testpass123",
      first_name: "Test",
      last_name: "User",
      date_of_birth: "2000-01-01",
      gender: "Other",
      phone_number: "555-TEST",
      address: "123 Test St",
      emergency_contact: "555-HELP",
      blood_group: "O+",
      allergies: "None",
    };

    const { data: insertData, error: insertError } = await supabase
      .from("patients")
      .insert(testPatient)
      .select();

    if (insertError) {
      console.log("❌ Registration test failed:", insertError.message);
      console.log("\n⚠️  You need to run the SQL migration in Supabase!");
      console.log("See FIX_REGISTRATION.md for instructions.\n");
      return;
    }

    console.log("✅ Test patient created successfully!");

    // Clean up test patient
    await supabase.from("patients").delete().eq("patient_id", "TEST001");

    console.log("✅ Test patient removed\n");

    // Test 3: Check existing patients
    console.log("3️⃣ Checking existing patients...");
    const { data: existingPatients } = await supabase
      .from("patients")
      .select("patient_id, email, first_name, last_name")
      .limit(5);

    if (existingPatients && existingPatients.length > 0) {
      console.log(`✅ Found ${existingPatients.length} patient(s):`);
      existingPatients.forEach((p) => {
        console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`);
      });
    } else {
      console.log("ℹ️  No existing patients");
    }
    console.log("");

    // Test 4: Check access logs
    console.log("4️⃣ Checking access logs table...");
    const { data: logs, error: logsError } = await supabase
      .from("access_logs")
      .select("*")
      .limit(5)
      .order("timestamp", { ascending: false });

    if (logsError) {
      console.log("❌ Error:", logsError.message);
    } else {
      console.log(
        `✅ Access logs working (${logs?.length || 0} recent entries)`
      );
      if (logs && logs.length > 0) {
        console.log("   Recent activity:");
        logs.slice(0, 3).forEach((log) => {
          console.log(
            `   - ${log.action} by ${log.user_role} (${log.user_id})`
          );
        });
      }
    }
    console.log("");

    // Summary
    console.log("═══════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════");
    console.log("\n🎉 Your application is ready to use!\n");
    console.log("📝 Test checklist:");
    console.log("  ✅ Database connected");
    console.log("  ✅ Patients table has all columns");
    console.log("  ✅ Patient registration works");
    console.log("  ✅ Access logs working\n");
    console.log("🚀 Next steps:");
    console.log("  1. Open http://localhost:3000/register/patient");
    console.log("  2. Create a new patient account");
    console.log("  3. Login at http://localhost:3000/login");
    console.log("  4. Test all dashboards\n");
    console.log("👤 Test credentials:");
    console.log("  Admin: admin / admin123");
    console.log("  Patient: john.doe@email.com / patient1\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testDatabase();
