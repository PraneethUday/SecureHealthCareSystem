// Quick test script to verify appointments setup
import { supabase } from "../lib/supabase";

async function testAppointmentsSetup() {
  console.log("🔍 Testing Appointments System Setup...\n");

  // Test 1: Check if hospitals table exists and has data
  console.log("1️⃣ Testing hospitals table...");
  const { data: hospitals, error: hospitalsError } = await supabase
    .from("hospitals")
    .select("*")
    .limit(3);

  if (hospitalsError) {
    console.error("❌ Hospitals table error:", hospitalsError.message);
    console.log("   ⚠️  Please run the SQL schema in Supabase Dashboard!");
    console.log("   📄 File: supabase/appointments-schema.sql\n");
    return false;
  }

  if (!hospitals || hospitals.length === 0) {
    console.error("❌ No hospitals found in database");
    console.log("   ⚠️  Please run the SQL schema in Supabase Dashboard!\n");
    return false;
  }

  console.log(`✅ Found ${hospitals.length} hospitals`);
  hospitals.forEach((h) =>
    console.log(`   - ${h.name} (${h.city}, ${h.state})`)
  );
  console.log("");

  // Test 2: Check if appointments table exists
  console.log("2️⃣ Testing appointments table...");
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .limit(1);

  if (appointmentsError) {
    console.error("❌ Appointments table error:", appointmentsError.message);
    return false;
  }

  console.log(
    `✅ Appointments table exists (${appointments?.length || 0} appointments)`
  );
  console.log("");

  // Test 3: Check if appointment_logs table exists
  console.log("3️⃣ Testing appointment_logs table...");
  const { data: logs, error: logsError } = await supabase
    .from("appointment_logs")
    .select("*")
    .limit(1);

  if (logsError) {
    console.error("❌ Appointment logs table error:", logsError.message);
    return false;
  }

  console.log(`✅ Appointment logs table exists (${logs?.length || 0} logs)`);
  console.log("");

  // Test 4: Check if doctors table has data
  console.log("4️⃣ Testing doctors table...");
  const { data: doctors, error: doctorsError } = await supabase
    .from("doctors")
    .select("id, doctor_id, first_name, last_name, specialization")
    .limit(5);

  if (doctorsError) {
    console.error("❌ Doctors table error:", doctorsError.message);
    return false;
  }

  if (!doctors || doctors.length === 0) {
    console.error("⚠️  No doctors found - you may need to add doctors");
  } else {
    console.log(`✅ Found ${doctors.length} doctors`);
    doctors.forEach((d) =>
      console.log(
        `   - Dr. ${d.first_name} ${d.last_name} (${d.specialization})`
      )
    );
  }
  console.log("");

  // Test 5: Check if patients table has data
  console.log("5️⃣ Testing patients table...");
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, patient_id, first_name, last_name, email")
    .limit(3);

  if (patientsError) {
    console.error("❌ Patients table error:", patientsError.message);
    return false;
  }

  if (!patients || patients.length === 0) {
    console.error("⚠️  No patients found - create a patient account first");
  } else {
    console.log(`✅ Found ${patients.length} patients`);
    patients.forEach((p) =>
      console.log(`   - ${p.first_name} ${p.last_name} (${p.patient_id})`)
    );
  }
  console.log("");

  return true;
}

// Run the test
testAppointmentsSetup()
  .then((success) => {
    if (success) {
      console.log("✅ ============================================");
      console.log("✅ APPOINTMENTS SYSTEM SETUP COMPLETE!");
      console.log("✅ ============================================\n");
      console.log("📝 Next Steps:");
      console.log("   1. Login as patient: http://localhost:3000/login");
      console.log("   2. Email: praneethudayakumar227@gmail.com");
      console.log("   3. Password: password123");
      console.log('   4. Click "Book Appointment" button\n');
    } else {
      console.log("\n❌ ============================================");
      console.log("❌ SETUP INCOMPLETE");
      console.log("❌ ============================================\n");
      console.log("📝 Required Action:");
      console.log("   1. Open Supabase Dashboard");
      console.log("   2. Go to SQL Editor");
      console.log("   3. Copy: supabase/appointments-schema.sql");
      console.log("   4. Paste and Run\n");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
