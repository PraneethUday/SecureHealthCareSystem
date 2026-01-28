import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAction } from "@/lib/logging";

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
        password, // In production, this should be hashed
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender,
        phone_number: phoneNumber,
        address,
        emergency_contact: emergencyContact,
        blood_group: bloodGroup,
        allergies: allergies || "None",
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

    // Log successful registration
    await logAction({
      userId: newPatientId,
      userRole: "patient",
      action: "registration_success",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
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
