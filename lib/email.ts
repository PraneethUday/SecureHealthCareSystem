import nodemailer from "nodemailer";

// Email service configuration
// In production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password", // Use App Password for Gmail
  },
});

/**
 * Send OTP code to user's email
 * @param email - User's email address
 * @param otp - 6-digit OTP code
 * @param userName - User's name (optional)
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  userName: string = "User"
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@securehealthcare.com",
      to: email,
      subject: "Your Secure Healthcare System OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Secure Healthcare System</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>
            
            <p style="color: #555; font-size: 14px;">You requested a login code for your Secure Healthcare System account. Use the code below to verify your identity:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 2px solid #667eea;">
                <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 5px;">
                  ${otp}
                </p>
              </div>
            </div>
            
            <p style="color: #666; font-size: 13px;">
              <strong>⏰ This code expires in 10 minutes.</strong> Do not share this code with anyone.
            </p>
            
            <p style="color: #555; font-size: 14px;">
              If you didn't request this code, you can safely ignore this email. Your account remains secure.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Secure Healthcare System | Security Notice<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `Your Secure Healthcare System OTP is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    return false;
  }
}

/**
 * Send registration confirmation email
 * @param email - User's email address
 * @param userName - User's name
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendRegistrationConfirmationEmail(
  email: string,
  userName: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@securehealthcare.com",
      to: email,
      subject: "Welcome to Secure Healthcare System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Secure Healthcare System</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Welcome, ${userName}! 🎉</p>
            
            <p style="color: #555; font-size: 14px;">Your account has been successfully created. You can now log in to access our healthcare services.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}/login" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Login
              </a>
            </div>
            
            <h3 style="color: #333; margin-top: 25px;">Account Security Tips:</h3>
            <ul style="color: #555; font-size: 14px;">
              <li>Keep your password strong and unique</li>
              <li>Never share your OTP codes with anyone</li>
              <li>Always use HTTPS when accessing your account</li>
              <li>Review login activity regularly</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Secure Healthcare System<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Registration confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send registration email to ${email}:`, error);
    return false;
  }
}

/**
 * Send password reset email
 * @param email - User's email address
 * @param resetToken - Secure reset token
 * @param userName - User's name
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@securehealthcare.com",
      to: email,
      subject: "Reset Your Secure Healthcare System Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Secure Healthcare System</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>
            
            <p style="color: #555; font-size: 14px;">You requested a password reset for your Secure Healthcare System account.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 13px;">
              <strong>⏰ This link expires in 1 hour.</strong>
            </p>
            
            <p style="color: #555; font-size: 14px;">
              If you didn't request this, please ignore this email and your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Secure Healthcare System<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${email}:`, error);
    return false;
  }
}
