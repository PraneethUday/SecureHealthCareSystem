import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function setupDatabase() {
  console.log("🚀 Starting database setup...\n");

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, "../supabase/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    console.log("📋 Creating tables...");
    const { error: schemaError } = await supabase.rpc("exec_sql", {
      sql: schema,
    });
    if (schemaError) {
      console.log(
        "Note: Direct SQL execution may require service role key. Creating tables via data insertion...\n"
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword("admin");
    console.log("🔒 Password hashed successfully\n");

    // Insert Admin
    console.log("👤 Creating admin user...");
    const { error: adminError } = await supabase.from("admins").upsert([
      {
        id: "admin",
        password: hashedPassword,
        full_name: "System Administrator",
        email: "admin@securehealthcare.com",
      },
    ]);

    if (adminError) {
      console.error("❌ Error creating admin:", adminError.message);
    } else {
      console.log("✅ Admin created successfully");
    }

    // Insert Sample Patients
    console.log("\n👥 Creating sample patients...");
    const { error: patientsError } = await supabase.from("patients").upsert([
      {
        patient_id: "P001",
        password: hashedPassword,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@email.com",
        phone: "555-0101",
        date_of_birth: "1990-05-15",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zip_code: "10001",
      },
      {
        patient_id: "P002",
        password: hashedPassword,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@email.com",
        phone: "555-0102",
        date_of_birth: "1985-08-22",
        address: "456 Oak Ave",
        city: "Los Angeles",
        state: "CA",
        zip_code: "90001",
      },
      {
        patient_id: "P003",
        password: hashedPassword,
        first_name: "Michael",
        last_name: "Johnson",
        email: "michael.j@email.com",
        phone: "555-0103",
        date_of_birth: "1978-03-10",
        address: "789 Pine Rd",
        city: "Chicago",
        state: "IL",
        zip_code: "60601",
      },
    ]);

    if (patientsError) {
      console.error("❌ Error creating patients:", patientsError.message);
    } else {
      console.log("✅ Sample patients created successfully");
    }

    // Insert Sample Doctors
    console.log("\n👨‍⚕️ Creating sample doctors...");
    const { error: doctorsError } = await supabase.from("doctors").upsert([
      {
        doctor_id: "D001",
        password: hashedPassword,
        first_name: "Sarah",
        last_name: "Williams",
        email: "dr.williams@hospital.com",
        phone: "555-0201",
        specialization: "Cardiology",
        license_number: "LIC-DR-001",
        department: "Cardiology",
        years_of_experience: 15,
      },
      {
        doctor_id: "D002",
        password: hashedPassword,
        first_name: "Robert",
        last_name: "Brown",
        email: "dr.brown@hospital.com",
        phone: "555-0202",
        specialization: "Pediatrics",
        license_number: "LIC-DR-002",
        department: "Pediatrics",
        years_of_experience: 10,
      },
      {
        doctor_id: "D003",
        password: hashedPassword,
        first_name: "Emily",
        last_name: "Davis",
        email: "dr.davis@hospital.com",
        phone: "555-0203",
        specialization: "Neurology",
        license_number: "LIC-DR-003",
        department: "Neurology",
        years_of_experience: 12,
      },
    ]);

    if (doctorsError) {
      console.error("❌ Error creating doctors:", doctorsError.message);
    } else {
      console.log("✅ Sample doctors created successfully");
    }

    // Insert Sample Nurses
    console.log("\n👩‍⚕️ Creating sample nurses...");
    const { error: nursesError } = await supabase.from("nurses").upsert([
      {
        nurse_id: "N001",
        password: hashedPassword,
        first_name: "Lisa",
        last_name: "Martinez",
        email: "nurse.martinez@hospital.com",
        phone: "555-0301",
        license_number: "LIC-NR-001",
        department: "Emergency",
        shift: "Day",
      },
      {
        nurse_id: "N002",
        password: hashedPassword,
        first_name: "David",
        last_name: "Garcia",
        email: "nurse.garcia@hospital.com",
        phone: "555-0302",
        license_number: "LIC-NR-002",
        department: "ICU",
        shift: "Night",
      },
      {
        nurse_id: "N003",
        password: hashedPassword,
        first_name: "Amanda",
        last_name: "Wilson",
        email: "nurse.wilson@hospital.com",
        phone: "555-0303",
        license_number: "LIC-NR-003",
        department: "Pediatrics",
        shift: "Day",
      },
    ]);

    if (nursesError) {
      console.error("❌ Error creating nurses:", nursesError.message);
    } else {
      console.log("✅ Sample nurses created successfully");
    }

    // Insert Sample Staff
    console.log("\n👔 Creating sample staff...");
    const { error: staffError } = await supabase.from("staff").upsert([
      {
        staff_id: "S001",
        password: hashedPassword,
        first_name: "Thomas",
        last_name: "Anderson",
        email: "thomas.a@hospital.com",
        phone: "555-0401",
        role: "Receptionist",
        department: "Front Desk",
      },
      {
        staff_id: "S002",
        password: hashedPassword,
        first_name: "Jennifer",
        last_name: "Taylor",
        email: "jennifer.t@hospital.com",
        phone: "555-0402",
        role: "Medical Records Clerk",
        department: "Records",
      },
      {
        staff_id: "S003",
        password: hashedPassword,
        first_name: "Christopher",
        last_name: "Moore",
        email: "chris.m@hospital.com",
        phone: "555-0403",
        role: "Billing Specialist",
        department: "Finance",
      },
    ]);

    if (staffError) {
      console.error("❌ Error creating staff:", staffError.message);
    } else {
      console.log("✅ Sample staff created successfully");
    }

    console.log("\n✨ Database setup completed!\n");
    console.log('📝 Sample Login Credentials (all passwords are "admin"):\n');
    console.log("Admin:");
    console.log("  ID: admin | Password: admin\n");
    console.log('Patients (use EMAIL to login):');
    console.log('  Email: john.doe@email.com | Password: admin (John Doe)');
    console.log('  Email: jane.smith@email.com | Password: admin (Jane Smith)');
    console.log('  Email: michael.j@email.com | Password: admin (Michael Johnson)\n');
    console.log("Doctors:");
    console.log("  ID: D001 | Password: admin (Dr. Sarah Williams)");
    console.log("  ID: D002 | Password: admin (Dr. Robert Brown)");
    console.log("  ID: D003 | Password: admin (Dr. Emily Davis)\n");
    console.log("Nurses:");
    console.log("  ID: N001 | Password: admin (Lisa Martinez)");
    console.log("  ID: N002 | Password: admin (David Garcia)");
    console.log("  ID: N003 | Password: admin (Amanda Wilson)\n");
    console.log("Staff:");
    console.log("  ID: S001 | Password: admin (Thomas Anderson)");
    console.log("  ID: S002 | Password: admin (Jennifer Taylor)");
    console.log("  ID: S003 | Password: admin (Christopher Moore)\n");
  } catch (error) {
    console.error("❌ Error during setup:", error);
  }
}

setupDatabase();
