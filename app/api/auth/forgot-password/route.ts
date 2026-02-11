import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create email transporter using your Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[Forgot Password] Processing request for:', email);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists in Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    const userExists = users?.some(u => u.email === email);

    if (!userExists) {
      console.log('[Forgot Password] User not found, but returning success (security)');
      // Don't reveal if email exists (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    console.log('[Forgot Password] User found, generating reset link...');

    // Generate password reset link using Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
      },
    });

    if (error) {
      console.error('[Forgot Password] Error generating link:', error);
      return NextResponse.json(
        { error: 'Failed to generate reset link' },
        { status: 500 }
      );
    }

    const resetLink = data.properties?.action_link;

    if (!resetLink) {
      console.error('[Forgot Password] No reset link generated');
      return NextResponse.json(
        { error: 'Failed to generate reset link' },
        { status: 500 }
      );
    }

    console.log('[Forgot Password] Reset link generated, sending email...');

    // Send custom email using your Gmail SMTP
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
                      Hello,
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
                        This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
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

Hello,

We received a request to reset your password for your SecureHealthCare account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
SecureHealthCare Team
    `;

    try {
      await transporter.sendMail({
        from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Password Reset Request - SecureHealthCare',
        text: emailText,
        html: emailHtml,
      });

      console.log('[Forgot Password] ✅ Reset email sent successfully to:', email);

      return NextResponse.json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    } catch (emailError: any) {
      console.error('[Forgot Password] Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
