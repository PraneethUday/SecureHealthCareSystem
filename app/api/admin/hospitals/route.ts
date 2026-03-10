import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAction } from "@/lib/logging";

/**
 * Admin-only endpoint to fetch all hospitals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    // Validate admin authorization
    if (!adminId || adminId !== "admin") {
      await logAction({
        userId: adminId || "unknown",
        userRole: "admin",
        action: "unauthorized_hospitals_view_attempt",
        status: "failure",
      });
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const { data: hospitals, error } = await supabaseAdmin
      .from("hospitals")
      .select("id, name, city, state")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching hospitals:", error);
      return NextResponse.json(
        { error: "Failed to fetch hospitals" },
        { status: 500 },
      );
    }

    await logAction({
      userId: adminId,
      userRole: "admin",
      action: "view_hospitals",
      status: "success",
    });

    return NextResponse.json({ hospitals: hospitals || [] });
  } catch (error) {
    console.error("Hospitals API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
