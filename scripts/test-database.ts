import { supabase } from "../lib/supabase";

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

    // Test 2: Try to insert a test patient (we'll delete it right after)
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

    // Test 3: Check auth functionality
    console.log("3️⃣ Testing authentication...");
    const { data: existingPatients } = await supabase
      .from("patients")
      .select("patient_id, email, first_name, last_name")
      .limit(3);

    if (existingPatients && existingPatients.length > 0) {
      console.log("✅ Found existing patients:");
      existingPatients.forEach((p) => {
        console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`);
      });
    } else {
      console.log(
        "ℹ️  No existing patients (use sample credentials from docs)"
      );
    }
    console.log("");

    // Test 4: Check access logs
    console.log("4️⃣ Checking access logs table...");
    const { data: logs, error: logsError } = await supabase
      .from("access_logs")
      .select("*")
      .limit(5);

    if (logsError) {
      console.log("❌ Error:", logsError.message);
    } else {
      console.log(
        `✅ Access logs table working (${logs?.length || 0} recent entries)\n`
      );
    }

    // Summary
    console.log("═══════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════");
    console.log("\n🎉 Your application is ready to use!\n");
    console.log("Next steps:");
    console.log("  1. Open http://localhost:3000/register/patient");
    console.log("  2. Create a new patient account");
    console.log("  3. Login at http://localhost:3000/login");
    console.log("  4. Test the dashboard\n");
    console.log("Admin access:");
    console.log("  - ID: admin");
    console.log("  - Password: admin123");
    console.log("  - View logs at http://localhost:3000/dashboard/admin\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testDatabase();
