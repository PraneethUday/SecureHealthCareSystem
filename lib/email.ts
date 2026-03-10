import nodemailer from "nodemailer";

// Create a fresh transporter per call to ensure env vars are read at runtime
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.error("❌ Missing email credentials: EMAIL_USER or EMAIL_PASSWORD not set");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

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
    const transporter = createTransporter();
    if (!transporter) return false;

    await transporter.verify();
    console.log("✅ SMTP connection verified for OTP email");

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
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
    const transporter = createTransporter();
    if (!transporter) return false;

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
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
    const transporter = createTransporter();
    if (!transporter) return false;

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
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

/**
 * Send appointment confirmation email to patient
 */
export async function sendAppointmentConfirmationEmail(data: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  department: string;
  hospitalName: string;
  isTelemedicine: boolean;
  zoomJoinUrl?: string;
  appointmentId: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const {
      patientEmail,
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      department,
      hospitalName,
      isTelemedicine,
      zoomJoinUrl,
      appointmentId,
    } = data;

    const mode = isTelemedicine ? "Video Consultation" : "In-Person";
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: "✅ Appointment Confirmed - SecureHealthCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Appointment Confirmed</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; background-color: white;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello <strong>${patientName}</strong>,</p>
            
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Your appointment has been successfully booked with SecureHealthCare. Here are the details:
            </p>
            
            <!-- Appointment Details Card -->
            <div style="background-color: #f9f9f9; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">📅 <strong>Date:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">⏰ <strong>Time:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${appointmentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">👨‍⚕️ <strong>Doctor:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">Dr. ${doctorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">🏥 <strong>Department:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${department}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 <strong>Hospital:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${hospitalName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">📋 <strong>Mode:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                    <span style="background-color: ${isTelemedicine ? '#e3f2fd' : '#f3e5f5'}; color: ${isTelemedicine ? '#1976d2' : '#7b1fa2'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                      ${mode}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            ${isTelemedicine && zoomJoinUrl ? `
              <!-- Video Call Section -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <p style="color: white; font-size: 16px; margin: 0 0 15px 0;">🎥 <strong>Join Your Video Consultation</strong></p>
                <a href="${zoomJoinUrl}" style="background-color: white; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
                  🔗 Join Video Call
                </a>
                <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 15px 0 0 0;">
                  Click the button above at your appointment time to join the video consultation.
                </p>
              </div>
            ` : ''}
            
            <!-- Appointment ID -->
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                📝 <strong>Appointment ID:</strong> <code style="background-color: white; padding: 2px 6px; border-radius: 3px;">${appointmentId}</code>
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/patient" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
                View Dashboard
              </a>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: #f0f7ff; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #1565c0; font-size: 13px; margin: 0; line-height: 1.6;">
                <strong>ℹ️ Need to cancel or reschedule?</strong><br>
                Log in to your SecureHealthCare account and manage your appointment from the dashboard.
              </p>
            </div>
            
            <!-- Security Notice -->
            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #2e7d32; font-size: 13px; margin: 0; line-height: 1.6;">
                🔒 <strong>Privacy & Security:</strong><br>
                Your medical data is encrypted and access is monitored as per our security policies. All communications are HIPAA compliant.
              </p>
            </div>
            
            <p style="color: #555; font-size: 14px; margin-top: 30px;">
              Wishing you good health,<br>
              <strong>SecureHealthCare Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              SecureHealthCare | support@securehealthcare.com
            </p>
            <p style="color: #999; font-size: 11px; margin: 5px 0;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
Hello ${patientName},

Your appointment has been successfully booked with SecureHealthCare.

📅 Date: ${formattedDate}
⏰ Time: ${appointmentTime}
👨‍⚕️ Doctor: Dr. ${doctorName}
🏥 Department: ${department}
📍 Hospital: ${hospitalName}
📋 Mode: ${mode}

${isTelemedicine && zoomJoinUrl ? `🔗 Join Video Call: ${zoomJoinUrl}\n` : ''}
📝 Appointment ID: ${appointmentId}

If you need to cancel or reschedule, please log in to your SecureHealthCare account.

For your privacy and security, your medical data is encrypted and access is monitored.

Wishing you good health,
SecureHealthCare Team
support@securehealthcare.com
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Appointment confirmation email sent to ${patientEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send appointment confirmation email:`, error);
    return false;
  }
}

/**
 * Send appointment notification email to doctor
 */
export async function sendDoctorAppointmentNotification(data: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  department: string;
  hospitalName: string;
  isTelemedicine: boolean;
  zoomHostUrl?: string;
  appointmentId: string;
  reason?: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const {
      doctorEmail,
      doctorName,
      patientName,
      appointmentDate,
      appointmentTime,
      department,
      hospitalName,
      isTelemedicine,
      zoomHostUrl,
      appointmentId,
      reason,
    } = data;

    const mode = isTelemedicine ? "Video Consultation" : "In-Person";
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: "📅 New Appointment Scheduled - SecureHealthCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 New Appointment</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; background-color: white;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear <strong>Dr. ${doctorName}</strong>,</p>
            
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              A new appointment has been scheduled with you. Here are the details:
            </p>
            
            <!-- Appointment Details Card -->
            <div style="background-color: #f9f9f9; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">👤 <strong>Patient:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${patientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">📅 <strong>Date:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">⏰ <strong>Time:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${appointmentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">🏥 <strong>Department:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${department}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 <strong>Hospital:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${hospitalName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">📋 <strong>Mode:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                    <span style="background-color: ${isTelemedicine ? '#e3f2fd' : '#f3e5f5'}; color: ${isTelemedicine ? '#1976d2' : '#7b1fa2'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                      ${mode}
                    </span>
                  </td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px; vertical-align: top;">📝 <strong>Reason:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${reason}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${isTelemedicine && zoomHostUrl ? `
              <!-- Video Call Section -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <p style="color: white; font-size: 16px; margin: 0 0 15px 0;">🎥 <strong>Start Video Consultation</strong></p>
                <a href="${zoomHostUrl}" style="background-color: white; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
                  🔗 Start Video Call (Host)
                </a>
                <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 15px 0 0 0;">
                  As the host, you can start the meeting before the patient joins.
                </p>
              </div>
            ` : ''}
            
            <!-- Appointment ID -->
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                📝 <strong>Appointment ID:</strong> <code style="background-color: white; padding: 2px 6px; border-radius: 3px;">${appointmentId}</code>
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/doctor" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
                View Dashboard
              </a>
            </div>
            
            <p style="color: #555; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>SecureHealthCare Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              SecureHealthCare | support@securehealthcare.com
            </p>
            <p style="color: #999; font-size: 11px; margin: 5px 0;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Doctor appointment notification sent to ${doctorEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send doctor appointment notification:`, error);
    return false;
  }
}

/**
 * Send appointment cancellation email
 */
export async function sendAppointmentCancellationEmail(data: {
  recipientEmail: string;
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  reason?: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const { recipientEmail, recipientName, appointmentDate, appointmentTime, doctorName, reason } = data;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: "❌ Appointment Cancelled - SecureHealthCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Appointment Cancelled</h1>
          </div>
          
          <div style="padding: 40px 30px; background-color: white;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${recipientName}</strong>,</p>
            
            <p style="color: #555; font-size: 14px;">
              Your appointment has been cancelled:
            </p>
            
            <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 5px 0; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Time:</strong> ${appointmentTime}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
              ${reason ? `<p style="margin: 5px 0; color: #333;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/patient" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Book New Appointment
              </a>
            </div>
            
            <p style="color: #555; font-size: 14px;">
              Best regards,<br>
              <strong>SecureHealthCare Team</strong>
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px;">SecureHealthCare | support@securehealthcare.com</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send cancellation email:`, error);
    return false;
  }
}

/**
 * Send appointment reminder email (24 hours before)
 */
export async function sendAppointmentReminderEmail(data: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  isTelemedicine: boolean;
  zoomJoinUrl?: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const { patientEmail, patientName, doctorName, appointmentDate, appointmentTime, isTelemedicine, zoomJoinUrl } = data;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"SecureHealthCare" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: "⏰ Appointment Reminder - Tomorrow - SecureHealthCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Appointment Reminder</h1>
          </div>
          
          <div style="padding: 40px 30px; background-color: white;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
            
            <p style="color: #555; font-size: 14px;">
              This is a friendly reminder about your upcoming appointment:
            </p>
            
            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 5px 0; color: #333;"><strong>📅 Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0; color: #333;"><strong>⏰ Time:</strong> ${appointmentTime}</p>
              <p style="margin: 5px 0; color: #333;"><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctorName}</p>
              <p style="margin: 5px 0; color: #333;"><strong>📋 Mode:</strong> ${isTelemedicine ? 'Video Consultation' : 'In-Person'}</p>
            </div>
            
            ${isTelemedicine && zoomJoinUrl ? `
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <p style="color: white; font-size: 16px; margin: 0 0 15px 0;">🎥 <strong>Ready for your video consultation?</strong></p>
                <a href="${zoomJoinUrl}" style="background-color: white; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Join Video Call
                </a>
              </div>
            ` : ''}
            
            <p style="color: #555; font-size: 14px;">
              See you soon!<br>
              <strong>SecureHealthCare Team</strong>
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px;">SecureHealthCare | support@securehealthcare.com</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${patientEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send reminder email:`, error);
    return false;
  }
}