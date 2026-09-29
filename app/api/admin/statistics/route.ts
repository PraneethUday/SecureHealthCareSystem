import { guard } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAction } from "@/lib/logging";

/**
 * Admin-only endpoint to fetch system statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate admin authorization
    const auth = await guard("admin");
    if (auth instanceof Response) return auth;
    const adminId = auth.businessId;

    // Fetch counts for all user types
    const [patientsResult, doctorsResult, nursesResult, staffResult] =
      await Promise.all([
        supabaseAdmin
          .from("patients")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("doctors")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("nurses")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("staff")
          .select("id", { count: "exact", head: true }),
      ]);

    const statistics = {
      totalPatients: patientsResult.count || 0,
      totalDoctors: doctorsResult.count || 0,
      totalNurses: nursesResult.count || 0,
      totalStaff: staffResult.count || 0,
      totalUsers:
        (patientsResult.count || 0) +
        (doctorsResult.count || 0) +
        (nursesResult.count || 0) +
        (staffResult.count || 0),
    };

    // Log the admin action
    await logAction({
      userId: adminId,
      userRole: "admin",
      action: "statistics_viewed",
      resourceType: "system",
      details: `Viewed system statistics`,
      status: "success",
    });

    return NextResponse.json(statistics, { status: 200 });
  } catch (error: any) {
    console.error("Fetch statistics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
