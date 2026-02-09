/**
 * Fix Doctor Login Issues
 * This script resets doctor passwords and clears any login locks
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables FIRST
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../.env.local") });

// Create Supabase client AFTER env is loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error(
    "   NEXT_PUBLIC_SUPABASE_URL:",
    supabaseUrl ? "✅ Set" : "❌ Missing",
  );
  console.error(
    "   SUPABASE_SERVICE_ROLE_KEY or ANON_KEY:",
    supabaseKey ? "✅ Set" : "❌ Missing",
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixDoctorLogins() {
  console.log("🔧 Fixing doctor login issues...\n");

  const doctors = [
    {
      id: "D001",
      password: "doctor1",
      name: "Dr. Rajesh Kumar",
      specialty: "Cardiology",
    },
    {
      id: "D002",
      password: "doctor2",
      name: "Dr. Priya Selvam",
      specialty: "Pediatrics",
    },
    {
      id: "D003",
      password: "doctor3",
      name: "Dr. Lakshmi Narayanan",
      specialty: "Neurology",
    },
  ];

  for (const doctor of doctors) {
    console.log(`Processing ${doctor.id} - ${doctor.name}...`);

    // Update doctor with plain text password and clear all locks/issues
    const { data, error } = await supabaseAdmin
      .from("doctors")
      .update({
        password: doctor.password,
        password_hash: null, // Clear hashed password to force plaintext fallback
        is_locked: false, // Unlock account
        locked_until: null, // Clear lock timestamp
        login_attempts: 0, // Reset failed attempts
        is_mfa_enabled: false, // Disable MFA for testing
      })
      .eq("doctor_id", doctor.id)
      .select();

    if (error) {
      console.error(`  ❌ Error updating ${doctor.id}:`, error.message);
    } else {
      console.log(`  ✅ Successfully reset ${doctor.id}`);
      console.log(`     Password: ${doctor.password}`);
      console.log(`     Specialty: ${doctor.specialty}\n`);
    }
  }

  // Verify all doctors
  console.log("📋 Verifying doctor accounts...\n");
  const { data: allDoctors, error: fetchError } = await supabaseAdmin
    .from("doctors")
    .select(
      "doctor_id, first_name, last_name, specialization, is_locked, login_attempts, is_mfa_enabled",
    )
    .in("doctor_id", ["D001", "D002", "D003"])
    .order("doctor_id");

  if (fetchError) {
    console.error("❌ Error fetching doctors:", fetchError.message);
  } else {
    console.table(allDoctors);
  }

  console.log("\n✅ Doctor login fix completed!");
  console.log("\nYou can now login with:");
  doctors.forEach((doc) => {
    console.log(`  • ${doc.id} / password: ${doc.password}`);
  });
}

// Run the fix
fixDoctorLogins()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
