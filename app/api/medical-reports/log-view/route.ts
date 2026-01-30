import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    // Insert into database (medical_report_logs)
    const { error: accessError } = await supabase.from("access_logs").insert({
      user_id: userId,
      user_role: userRole,
      action: "view_report",
      resource_type: "medical_report",
      resource_id: reportId,
      timestamp: new Date().toISOString()
    });

    if (accessError) console.error("Failed to insert into access_logs:", accessError);

    const { error } = await supabase.from("medical_report_logs").insert([
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
