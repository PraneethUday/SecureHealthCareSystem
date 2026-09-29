import { NextRequest, NextResponse } from "next/server";
// Public sign-up: the insert is privileged, so it runs server-side with the
// service role after the input has been validated below.
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { provisionAuthUser } from "@/lib/auth-provisioning";
import { logAction } from "@/lib/logging";
import { hashPassword, validatePasswordComplexity } from "@/lib/security";
import { sendRegistrationConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
    } = body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !dateOfBirth ||
      !gender ||
      !phoneNumber ||
      !address ||
      !emergencyContact ||
      !bloodGroup
    ) {
      await logAction({
        userId: email,
        userRole: "patient",
        action: "registration_failed_missing_fields",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
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
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("email")
      .eq("email", email)
      .single();

    if (existingPatient) {
      await logAction({
        userId: email,
        userRole: "patient",
        action: "registration_failed_email_exists",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash the password using bcrypt
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return NextResponse.json(
        { error: "Error processing registration. Please try again." },
        { status: 500 }
      );
    }

    // Generate patient ID
    const { data: lastPatient } = await supabase
      .from("patients")
      .select("patient_id")
      .order("patient_id", { ascending: false })
      .limit(1)
      .single();

    let newPatientId = "P001";
    if (lastPatient && lastPatient.patient_id) {
      const lastNumber = parseInt(lastPatient.patient_id.substring(1));
      newPatientId = `P${String(lastNumber + 1).padStart(3, "0")}`;
    }

    // Insert new patient
    const { data, error } = await supabase
      .from("patients")
      .insert({
        patient_id: newPatientId,
        email,
        password_hash: passwordHash, // Store hashed password, not plaintext
        password: null, // Clear old plaintext password field
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender,
        phone_number: phoneNumber,
        address,
        emergency_contact: emergencyContact,
        blood_group: bloodGroup,
        allergies: allergies || "None",
        is_mfa_enabled: false, // TOTP is optional for patients
        mfa_method: "totp",
        password_changed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Registration error:", error);
      await logAction({
        userId: email,
        userRole: "patient",
        action: "registration_failed_database_error",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 },
      );
    }

    try {
      await provisionAuthUser(supabase, {
        email,
        role: "patient",
        profileId: data.id,
        password,
      });
    } catch (authError) {
      console.error("Auth provisioning error:", authError);
      await supabase.from("patients").delete().eq("id", data.id);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 },
      );
    }

    // Send registration confirmation email
    const confirmationEmailSent = await sendRegistrationConfirmationEmail(
      email,
      `${firstName} ${lastName}`
    );

    // Log successful registration
    await logAction({
      userId: newPatientId,
      userRole: "patient",
      action: "registration_success",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json(
      {
        message: "Account created successfully. You can now sign in.",
        patientId: newPatientId,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
