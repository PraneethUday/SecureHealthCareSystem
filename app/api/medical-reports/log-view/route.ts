import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { reportId, userId, userRole } = await request.json();

    console.log("👁️  [Log View] Logging view for report:", reportId);

    if (!reportId || !userId || !userRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the view action
    const { error } = await supabase
      .from("medical_report_logs")
      .insert([
        {
          report_id: reportId,
          action_type: "viewed",
          performed_by_user_id: userId,
          performed_by_role: userRole,
        },
      ]);

    if (error) {
      console.error("❌ [Log View] Error:", error);
      return NextResponse.json(
        { error: `Failed to log view: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("✅ [Log View] View logged successfully");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [Log View] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
