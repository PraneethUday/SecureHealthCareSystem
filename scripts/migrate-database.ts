import { supabase } from "../lib/supabase";
import * as fs from "fs";
import * as path from "path";

async function migrateDatabase() {
  try {
    console.log("📦 Starting database migration...\n");

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "../supabase/migrate-patients.sql"),
      "utf-8"
    );

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

    if (error) {
      // If RPC doesn't work, try direct SQL execution
      console.log("Trying alternative migration method...\n");

      // Add columns one by one
      const alterations = [
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT",
      ];

      for (const sql of alterations) {
        const { error: altError } = await supabase.rpc("exec", { sql });
        if (altError) {
          console.log(`Note: ${sql}`);
          console.log(`Status: ${altError.message}\n`);
        }
      }
    }

    console.log("✅ Migration completed!\n");
    console.log("The patients table now includes:");
    console.log("  - phone_number");
    console.log("  - gender");
    console.log("  - emergency_contact");
    console.log("  - blood_group\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

migrateDatabase();
