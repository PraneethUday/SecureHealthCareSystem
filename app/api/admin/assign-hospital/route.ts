import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAction } from "@/lib/logging";

/**
 * Admin-only endpoint to assign a user to a hospital
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, userId, userRole, hospitalId } = body;

    // Validate admin authorization
    if (!adminId || adminId !== "admin") {
      await logAction({
        userId: adminId || "unknown",
        userRole: "admin",
        action: "unauthorized_hospital_assign_attempt",
        status: "failure",
      });
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    if (!userId || !userRole || !hospitalId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userRole, hospitalId" },
        { status: 400 },
      );
    }

    // Determine the junction table and ID field based on role
    const junctionTable =
      userRole === "doctor"
        ? "doctor_hospitals"
        : userRole === "nurse"
          ? "nurse_hospitals"
          : "staff_hospitals";

    const userIdField =
      userRole === "doctor"
        ? "doctor_id"
        : userRole === "nurse"
          ? "nurse_id"
          : "staff_id";

    // First, get the user's UUID from the table
    const table =
      userRole === "doctor"
        ? "doctors"
        : userRole === "nurse"
          ? "nurses"
          : "staff";

    const idField = `${userRole}_id`;

    const { data: userData, error: userError } = await supabaseAdmin
      .from(table)
      .select("id")
      .eq(idField, userId)
      .single();

    if (userError || !userData) {
      console.error("Error finding user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userUuid = userData.id;

    // Remove existing hospital assignments and add new one
    // First delete existing assignments
    const { error: deleteError } = await supabaseAdmin
      .from(junctionTable)
      .delete()
      .eq(userIdField, userUuid);

    if (deleteError) {
      console.error("Error removing old hospital assignment:", deleteError);
      // Continue anyway - might not have had any assignments
    }

    // Add new hospital assignment
    const { error: insertError } = await supabaseAdmin
      .from(junctionTable)
      .insert({
        [userIdField]: userUuid,
        hospital_id: hospitalId,
        is_primary: true,
      });

    if (insertError) {
      console.error("Error assigning hospital:", insertError);
      return NextResponse.json(
        { error: "Failed to assign hospital" },
        { status: 500 },
      );
    }

    // Fetch hospital name for logging
    const { data: hospitalData } = await supabaseAdmin
      .from("hospitals")
      .select("name")
      .eq("id", hospitalId)
      .single();

    await logAction({
      userId: adminId,
      userRole: "admin",
      action: "assign_hospital",
      resourceType: userRole,
      resourceId: userId,
      details: `Assigned ${userRole} ${userId} to hospital: ${hospitalData?.name || hospitalId}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned to ${hospitalData?.name || "hospital"}`,
    });
  } catch (error) {
    console.error("Hospital assignment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
