import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAction } from "@/lib/logging";
import { hashPassword, validatePasswordComplexity } from "@/lib/security";
import { UserRole } from "@/lib/database.types";

/**
 * Admin-only endpoint to create users (doctors, nurses, staff)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      role,
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      // Doctor-specific fields
      specialization,
      licenseNumber,
      yearsOfExperience,
      // Nurse-specific fields
      shift,
      // Staff-specific fields
      staffRole,
      // Hospital assignment (required for doctor, nurse, staff)
      hospitalId,
      // Admin authentication
      adminId,
    } = body;

    // Validate admin authorization
    if (!adminId || adminId !== "admin") {
      await logAction({
        userId: adminId || "unknown",
        userRole: "admin",
        action: "unauthorized_user_creation_attempt",
        status: "failure",
      });
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    // Validate role
    if (!["doctor", "nurse", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be doctor, nurse, or staff." },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 },
      );
    }

    // Validate password strength
    const complexityResult = validatePasswordComplexity(password);
    if (!complexityResult.valid) {
      return NextResponse.json(
        { error: complexityResult.message },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Role-specific validation
    if (role === "doctor") {
      if (!specialization || !licenseNumber) {
        return NextResponse.json(
          {
            error: "Specialization and license number are required for doctors",
          },
          { status: 400 },
        );
      }
    } else if (role === "nurse") {
      if (!licenseNumber) {
        return NextResponse.json(
          { error: "License number is required for nurses" },
          { status: 400 },
        );
      }
    } else if (role === "staff") {
      if (!staffRole) {
        return NextResponse.json(
          { error: "Staff role is required for staff members" },
          { status: 400 },
        );
      }
    }

    // Hospital assignment is required for all roles
    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital assignment is required" },
        { status: 400 },
      );
    }

    // Validate hospital exists
    const { data: hospitalData, error: hospitalError } = await supabaseAdmin
      .from("hospitals")
      .select("id, name")
      .eq("id", hospitalId)
      .maybeSingle();

    if (hospitalError || !hospitalData) {
      return NextResponse.json(
        { error: "Invalid hospital selected" },
        { status: 400 },
      );
    }

    const table =
      role === "doctor" ? "doctors" : role === "nurse" ? "nurses" : "staff";
    const idPrefix = role === "doctor" ? "D" : role === "nurse" ? "N" : "S";
    const idField = `${role}_id`;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from(table)
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      await logAction({
        userId: adminId,
        userRole: "admin",
        action: `${role}_creation_failed_email_exists`,
        details: `Email ${email} already registered`,
        status: "failure",
      });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash the password
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return NextResponse.json(
        { error: "Error processing registration. Please try again." },
        { status: 500 },
      );
    }

    // Generate user ID
    const { data: lastUser } = await supabaseAdmin
      .from(table)
      .select(idField)
      .order(idField, { ascending: false })
      .limit(1)
      .maybeSingle();

    let newUserId = `${idPrefix}001`;
    if (lastUser && lastUser[idField as keyof typeof lastUser]) {
      const lastNumber = parseInt(
        (lastUser[idField as keyof typeof lastUser] as string).substring(1),
      );
      newUserId = `${idPrefix}${String(lastNumber + 1).padStart(3, "0")}`;
    }

    // Prepare insert data based on role
    let insertData: any = {
      [idField]: newUserId,
      email,
      password_hash: passwordHash,
      password: null, // Clear old plaintext password field
      first_name: firstName,
      last_name: lastName,
      phone,
      department: department || null,
      is_mfa_enabled: true,
      mfa_method: "email",
      password_changed_at: new Date().toISOString(),
    };

    if (role === "doctor") {
      insertData.specialization = specialization;
      insertData.license_number = licenseNumber;
      insertData.years_of_experience = yearsOfExperience || 0;
    } else if (role === "nurse") {
      insertData.license_number = licenseNumber;
      insertData.shift = shift || null;
    } else if (role === "staff") {
      insertData.role = staffRole;
    }

    // Insert new user
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`${role} creation error:`, error);
      await logAction({
        userId: adminId,
        userRole: "admin",
        action: `${role}_creation_failed_database_error`,
        details: error.message,
        status: "failure",
      });
      return NextResponse.json(
        { error: `Failed to create ${role} account` },
        { status: 500 },
      );
    }

    // Create hospital association in junction table
    const junctionTable =
      role === "doctor"
        ? "doctor_hospitals"
        : role === "nurse"
          ? "nurse_hospitals"
          : "staff_hospitals";
    const junctionFkField =
      role === "doctor"
        ? "doctor_id"
        : role === "nurse"
          ? "nurse_id"
          : "staff_id";

    const { error: junctionError } = await supabaseAdmin
      .from(junctionTable)
      .insert({
        [junctionFkField]: data.id,
        hospital_id: hospitalId,
        is_primary: true,
      });

    if (junctionError) {
      console.error(`${role}-hospital association error:`, junctionError);
      // Clean up the user if hospital association fails
      await supabaseAdmin.from(table).delete().eq("id", data.id);
      return NextResponse.json(
        { error: `Failed to assign ${role} to hospital` },
        { status: 500 },
      );
    }

    // Log successful user creation
    await logAction({
      userId: adminId,
      userRole: "admin",
      action: `${role}_created`,
      resourceType: "user",
      resourceId: newUserId,
      details: `Created ${role}: ${firstName} ${lastName} (${email}) at hospital ${hospitalData.name}`,
      status: "success",
    });

    return NextResponse.json(
      {
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
        userId: newUserId,
        data: {
          id: newUserId,
          firstName,
          lastName,
          email,
          role,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
