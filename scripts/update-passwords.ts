import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePasswords() {
  console.log("🔑 Updating passwords to simple ones...\n");

  try {
    // Update Admin
    console.log("Updating admin password...");
    await supabase.from("admins").update({ password: "admin123" }).eq("id", "admin");

    // Update Patients
    console.log("Updating patient passwords...");
    await supabase.from("patients").update({ password: "patient1" }).eq("patient_id", "P001");
    await supabase.from("patients").update({ password: "patient2" }).eq("patient_id", "P002");
    await supabase.from("patients").update({ password: "patient3" }).eq("patient_id", "P003");

    // Update Doctors
    console.log("Updating doctor passwords...");
    await supabase.from("doctors").update({ password: "doctor1" }).eq("doctor_id", "D001");
    await supabase.from("doctors").update({ password: "doctor2" }).eq("doctor_id", "D002");
    await supabase.from("doctors").update({ password: "doctor3" }).eq("doctor_id", "D003");

    // Update Nurses
    console.log("Updating nurse passwords...");
    await supabase.from("nurses").update({ password: "nurse1" }).eq("nurse_id", "N001");
    await supabase.from("nurses").update({ password: "nurse2" }).eq("nurse_id", "N002");
    await supabase.from("nurses").update({ password: "nurse3" }).eq("nurse_id", "N003");

    // Update Staff
    console.log("Updating staff passwords...");
    await supabase.from("staff").update({ password: "staff1" }).eq("staff_id", "S001");
    await supabase.from("staff").update({ password: "staff2" }).eq("staff_id", "S002");
    await supabase.from("staff").update({ password: "staff3" }).eq("staff_id", "S003");

    console.log("\n✅ All passwords updated successfully!\n");
    console.log("📝 New Login Credentials:\n");
    console.log("Admin:");
    console.log("  ID: admin | Password: admin123\n");
    console.log("Patients (use EMAIL):");
    console.log("  Email: john.doe@email.com | Password: patient1");
    console.log("  Email: jane.smith@email.com | Password: patient2");
    console.log("  Email: michael.j@email.com | Password: patient3\n");
    console.log("Doctors:");
    console.log("  ID: D001 | Password: doctor1");
    console.log("  ID: D002 | Password: doctor2");
    console.log("  ID: D003 | Password: doctor3\n");
    console.log("Nurses:");
    console.log("  ID: N001 | Password: nurse1");
    console.log("  ID: N002 | Password: nurse2");
    console.log("  ID: N003 | Password: nurse3\n");
    console.log("Staff:");
    console.log("  ID: S001 | Password: staff1");
    console.log("  ID: S002 | Password: staff2");
    console.log("  ID: S003 | Password: staff3\n");
  } catch (error) {
    console.error("❌ Error updating passwords:", error);
  }
}

updatePasswords();
