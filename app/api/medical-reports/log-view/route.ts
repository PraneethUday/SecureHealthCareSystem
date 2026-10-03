import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import { logAction } from "@/lib/logging";

export async function POST(request: NextRequest) {
  const auth = await guard();
  if (auth instanceof Response) return auth;

  const { reportId, action } = await request.json();
  if (!reportId) {
    return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
  }
  const actionType = action === "downloaded" ? "downloaded" : "viewed";

  // Runs as the caller: the insert policy requires the report to be visible
  // and performed_by_user_id to be the caller.
  const { error } = await auth.supabase.from("medical_report_logs").insert({
    report_id: reportId,
    action_type: actionType,
    performed_by_user_id: auth.profileId,
    performed_by_role: auth.role,
  });
  if (error) {
    return NextResponse.json({ error: "Report not found or access denied" }, { status: 403 });
  }

  await logAction({
    userId: auth.businessId,
    userRole: auth.role,
    action: `${actionType}_report`,
    resourceType: "medical_report",
    resourceId: reportId,
    status: "success",
  });
  return NextResponse.json({ success: true });
}
