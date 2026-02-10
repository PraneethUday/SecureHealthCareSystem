import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAction } from "@/lib/logging";

/**
 * Admin-only endpoint to fetch all users
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    const role = searchParams.get("role"); // Optional filter by role

    // Validate admin authorization
    if (!adminId || adminId !== "admin") {
      await logAction({
        userId: adminId || "unknown",
        userRole: "admin",
        action: "unauthorized_users_view_attempt",
        status: "failure",
      });
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    let allUsers: any[] = [];

    // Fetch based on role filter or all roles
    const rolesToFetch = role ? [role] : ["doctor", "nurse", "staff"];

    for (const userRole of rolesToFetch) {
      const table = userRole === "doctor" ? "doctors" : userRole === "nurse" ? "nurses" : "staff";
      const idField = `${userRole}_id`;

      const { data, error } = await supabaseAdmin
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`Error fetching ${userRole}s:`, error);
        continue; // Continue fetching other roles even if one fails
      }

      if (data) {
        // Transform data to consistent format and exclude sensitive fields
        const transformedData = data.map((user: any) => ({
          id: user.id,
          userId: user[idField],
          role: userRole,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone,
          department: user.department,
          specialization: user.specialization, // Doctor only
          licenseNumber: user.license_number, // Doctor and Nurse
          yearsOfExperience: user.years_of_experience, // Doctor only
          shift: user.shift, // Nurse only
          staffRole: user.role, // Staff only
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          isMfaEnabled: user.is_mfa_enabled,
        }));

        allUsers = allUsers.concat(transformedData);
      }
    }

    // Log the admin action
    await logAction({
      userId: adminId,
      userRole: "admin",
      action: "users_viewed",
      resourceType: "user",
      details: `Viewed ${allUsers.length} users${role ? ` (filtered by ${role})` : ""}`,
      status: "success",
    });

    return NextResponse.json(
      {
        users: allUsers,
        total: allUsers.length,
        roles: rolesToFetch,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Admin-only endpoint to delete a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    // Validate admin authorization
    if (!adminId || adminId !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    if (!["doctor", "nurse", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const table = role === "doctor" ? "doctors" : role === "nurse" ? "nurses" : "staff";
    const idField = `${role}_id`;

    // Delete the user
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq(idField, userId);

    if (error) {
      console.error(`Error deleting ${role}:`, error);
      await logAction({
        userId: adminId,
        userRole: "admin",
        action: `${role}_deletion_failed`,
        resourceType: "user",
        resourceId: userId,
        details: error.message,
        status: "failure",
      });
      return NextResponse.json(
        { error: `Failed to delete ${role}` },
        { status: 500 }
      );
    }

    // Log successful deletion
    await logAction({
      userId: adminId,
      userRole: "admin",
      action: `${role}_deleted`,
      resourceType: "user",
      resourceId: userId,
      details: `Deleted ${role}: ${userId}`,
      status: "success",
    });

    return NextResponse.json(
      { message: `${role} deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
