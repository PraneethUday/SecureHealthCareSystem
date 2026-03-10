import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Define user tables and their email fields
const USER_TABLES = [
  { table: "patients", emailField: "email", role: "patient" },
  { table: "doctors", emailField: "email", role: "doctor" },
  { table: "nurses", emailField: "email", role: "nurse" },
  { table: "staff", emailField: "email", role: "staff" },
];

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log("[Forgot Password API] 1. Processing request for:", email);
    console.log("[Forgot Password API] Config check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      hasEmail: !!emailUser,
      hasPass: !!emailPass,
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "[Forgot Password API] ❌ ERROR: Missing Supabase configuration",
      );
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase keys" },
        { status: 500 },
      );
    }

    console.log("[Forgot Password API] 2. Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[Forgot Password API] 3. Searching for user in tables...");

    // Search for user in all tables
    let foundUser: any = null;
    let foundTable: string = "";
    let foundRole: string = "";

    for (const { table, emailField, role } of USER_TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select("id, email, first_name, last_name")
        .eq(emailField, email.toLowerCase())
        .single();

      if (data && !error) {
        foundUser = data;
        foundTable = table;
        foundRole = role;
        console.log(`[Forgot Password API] ✅ User found in ${table}`);
        break;
      }
    }

    // If user not found, return success for security (prevent email enumeration)
    if (!foundUser) {
      console.log(
        "[Forgot Password API] User not found, returning success for security",
      );
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    console.log("[Forgot Password API] 4. Generating secure reset token...");

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiry to 1 hour from now
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    console.log("[Forgot Password API] 5. Storing reset token in database...");

    // Store the hashed token in the user's table
    const { error: updateError } = await supabase
      .from(foundTable)
      .update({
        reset_token: resetTokenHash,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq("id", foundUser.id);

    if (updateError) {
      console.error(
        "[Forgot Password API] ❌ ERROR storing reset token:",
        updateError,
      );
      return NextResponse.json(
        { error: "Failed to generate reset link. Please try again." },
        { status: 500 },
      );
    }

    // Build the reset link with the unhashed token
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}&role=${foundRole}`;

    console.log("[Forgot Password API] 6. Sending email with Nodemailer...");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - SecureHealthCare</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">
                      🔐 Password Reset Request
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Hello ${foundUser.first_name || "SecureHealthcare User"},
                    </p>
                    
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      We received a request to reset your password for your <strong>SecureHealthCare</strong> account.
                    </p>

                    <p style="font-size: 16px; color: #333; margin: 0 0 30px 0;">
                      Click the button below to reset your password:
                    </p>

                    <!-- Reset Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 14px; color: #666; margin: 30px 0 20px 0;">
                      Or copy and paste this link into your browser:
                    </p>

                    <p style="font-size: 12px; color: #ef4444; background-color: #fef2f2; padding: 12px; border-radius: 6px; word-break: break-all; margin: 0 0 30px 0;">
                      ${resetLink}
                    </p>

                    <!-- Security Notice -->
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 30px 0;">
                      <p style="margin: 0 0 10px 0; font-weight: bold; color: #dc2626; font-size: 14px;">
                        ⚠️ Security Notice
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #666;">
                        This link will expire in <strong>1 hour</strong>. If you did not request this password reset, please ignore this email or contact support if you have concerns.
                      </p>
                    </div>

                    <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
                      Best regards,<br>
                      <strong style="color: #333;">SecureHealthCare Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #9ca3af;">
                      This is an automated message, please do not reply to this email.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      © ${new Date().getFullYear()} SecureHealthCare. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailText = `
Password Reset Request

Hello ${foundUser.first_name || "SecureHealthcare User"},

We received a request to reset your password for your SecureHealthCare account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
SecureHealthCare Team
    `;

    if (!emailUser || !emailPass) {
      console.error(
        "[Forgot Password API] ❌ ERROR: Missing email credentials",
      );
      return NextResponse.json(
        { error: "Server configuration error: Missing email credentials" },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
      console.log("[Forgot Password API] Transporter verified");

      await transporter.sendMail({
        from: `"SecureHealthCare" <${emailUser}>`,
        to: email,
        subject: "🔐 Password Reset Request - SecureHealthCare",
        text: emailText,
        html: emailHtml,
      });

      console.log(
        "[Forgot Password] ✅ Reset email sent successfully to:",
        email,
      );

      return NextResponse.json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (emailError: any) {
      console.error(
        "[Forgot Password API] ❌ ERROR sending email:",
        emailError,
      );
      return NextResponse.json(
        { error: `Failed to send reset email: ${emailError.message}` },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("[Forgot Password API] ❌ UNEXPECTED ERROR:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
