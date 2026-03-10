import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log("[Reset Password] Processing request for:", email);

    // Lazy initialization of Supabase client inside handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Reset Password] Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // The tables and their corresponding ID fields for the query fallback
    const tables = [
      { name: "patients", idField: "id" },
      { name: "doctors", idField: "id" },
      { name: "nurses", idField: "id" },
      { name: "staff", idField: "id" },
      { name: "admins", idField: "id" }
    ];

    let foundUser = null;
    let foundTable = null;

    // Find user with matching token and email across all tables
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table.name)
        .select(`id, email, password_reset_token, password_reset_expires_at`)
        .eq("email", email)
        .eq("password_reset_token", resetTokenHash)
        .single();

      if (data && !error) {
        foundUser = data;
        foundTable = table.name;
        break;
      }
    }

    if (!foundUser || !foundTable) {
      console.log("[Reset Password] Invalid token or email");
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    // Check if token has expired
    const tokenExpiry = new Date(foundUser.password_reset_expires_at);
    if (tokenExpiry < new Date()) {
      console.log("[Reset Password] Token expired");
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    // Hash the new password using the legacy salt logic to match existing system behavior 
    // or bcrypt as done natively.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password and clear reset token
    // We update both password and password_hash for backward compatibility where plaintext was required
    const { error: updateError } = await supabase
      .from(foundTable as string)
      .update({
        password: password, // The app still relies on this in auth-actions.ts for old users
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", foundUser.id);

    if (updateError) {
      console.error("[Reset Password] Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 },
      );
    }

    console.log("[Reset Password] ✅ Password reset successful for:", email);

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error: any) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
