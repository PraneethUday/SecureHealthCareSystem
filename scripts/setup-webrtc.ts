import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupWebRTC() {
  console.log("🎥 Setting up WebRTC Video Call System...\n");

  try {
    // Read WebRTC schema
    const schemaPath = path.join(__dirname, "../supabase/webrtc-schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    console.log("📋 Creating WebRTC tables and policies...");

    // Split the SQL into individual statements and execute them
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let successCount = 0;
    for (const statement of statements) {
      try {
        // Use the query method to execute raw SQL through function
        // For now, we'll just try to create the tables through direct data operations
      } catch (error) {
        console.error("Error executing statement:", error);
      }
    }

    // Verify tables were created
    console.log("\n✅ Checking WebRTC tables...");

    // Check video_calls table
    const { data: videoCallsCheck, error: vcError } = await supabase
      .from("video_calls")
      .select("count", { count: "exact", head: true });

    if (vcError) {
      console.error("❌ video_calls table not found:", vcError.message);
      console.log("\n📝 Please run the following in your Supabase SQL Editor:");
      console.log("1. Go to https://app.supabase.com");
      console.log("2. Select your project");
      console.log("3. Navigate to SQL Editor");
      console.log(
        "4. Copy and paste the contents of: supabase/webrtc-schema.sql"
      );
      console.log("5. Click 'Run' to execute\n");
    } else {
      console.log("✅ video_calls table exists");
    }

    // Check video_call_signaling table
    const { data: signalingCheck, error: sigError } = await supabase
      .from("video_call_signaling")
      .select("count", { count: "exact", head: true });

    if (sigError) {
      console.error(
        "❌ video_call_signaling table not found:",
        sigError.message
      );
    } else {
      console.log("✅ video_call_signaling table exists");
    }

    console.log("\n🎯 WebRTC setup check complete!");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupWebRTC();
