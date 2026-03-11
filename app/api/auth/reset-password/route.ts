import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/security";
import crypto from "crypto";

// Define user tables and their email fields
const ROLE_TABLES: Record<string, string> = {
  patient: "patients",
  doctor: "doctors",
  nurse: "nurses",
  staff: "staff",
};

export async function POST(request: NextRequest) {
  try {
    const { token, email, password, role } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log(
      "[Reset Password] Processing request for:",
      email,
      "role:",
      role,
    );

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

    // Determine which table to search based on role, or search all tables
    let user: any = null;
    let userTable: string = "";

    if (role && ROLE_TABLES[role]) {
      // If role is provided, search only that table
      const table = ROLE_TABLES[role];
      const { data, error } = await supabase
        .from(table)
        .select("id, email, reset_token, reset_token_expiry")
        .eq("email", email.toLowerCase())
        .eq("reset_token", resetTokenHash)
        .single();

      if (data && !error) {
        user = data;
        userTable = table;
      }
    } else {
      // Search all tables if role is not provided
      for (const [roleName, table] of Object.entries(ROLE_TABLES)) {
        const { data, error } = await supabase
          .from(table)
          .select("id, email, reset_token, reset_token_expiry")
          .eq("email", email.toLowerCase())
          .eq("reset_token", resetTokenHash)
          .single();

        if (data && !error) {
          user = data;
          userTable = table;
          console.log(`[Reset Password] User found in ${table}`);
          break;
        }
      }
    }

    if (!user) {
      console.log("[Reset Password] Invalid token or email");
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    // Check if token has expired
    const tokenExpiry = new Date(user.reset_token_expiry);
    if (tokenExpiry < new Date()) {
      console.log("[Reset Password] Token expired");
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Validate password strength (using 12 as per security requirement)
    if (password.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters long for high security" },
        { status: 400 },
      );
    }

    // Hash the new password using project's security utility
    const hashedPasswordHash = await hashPassword(password);

    // Update user's password and clear reset token
    // We update password_hash and clear the legacy password field
    const { error: updateError } = await supabase
      .from(userTable)
      .update({
        password_hash: hashedPasswordHash,
        password: null, // Clear legacy plaintext/incorrectly hashed password
        reset_token: null,
        reset_token_expiry: null,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

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
