import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAction } from "@/lib/logging";
import { hashPassword, generateOTP, generateOTPExpiry, hashOTP } from "@/lib/security";
import { sendOTPEmail, sendRegistrationConfirmationEmail } from "@/lib/email";

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
        action: "registration_failed",
        details: "Missing required fields",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
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
        action: "registration_failed",
        details: "Email already exists",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
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

    // Generate initial OTP for email verification
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiry = generateOTPExpiry();

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
        is_mfa_enabled: true, // Enable MFA by default
        mfa_method: "email",
        password_changed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Registration error:", error);
      await logAction({
        userId: email,
        userRole: "patient",
        action: "registration_failed",
        details: `Database error: ${error.message}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Store initial OTP for email verification
    const { error: otpError } = await supabase.from("otp_logs").insert({
      user_id: newPatientId,
      user_role: "patient",
      otp_hash: otpHash,
      expires_at: otpExpiry.toISOString(),
      attempts: 0,
    });

    if (otpError) {
      console.error("OTP storage error:", otpError);
      // Don't fail registration if OTP storage fails, but log it
      await logAction({
        userId: newPatientId,
        userRole: "patient",
        action: "otp_storage_failed",
        details: "Failed to store initial OTP",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
    }

    // Send OTP verification email
    const otpEmailSent = await sendOTPEmail(
      email,
      otp,
      `${firstName} ${lastName}`
    );

    if (!otpEmailSent) {
      console.warn("Failed to send OTP email during registration");
      // Don't fail registration if email sending fails
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
      details: `New patient account created: ${firstName} ${lastName}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json(
      {
        message: "Account created successfully. Please verify your email.",
        patientId: newPatientId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
