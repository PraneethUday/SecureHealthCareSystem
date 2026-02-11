/**
 * Quick Email Test - Send to Praneeth
 * Run: npx tsx scripts/test-email-praneeth.ts
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testEmail() {
    console.log('🧪 Testing Email to praneethp227@gmail.com...\n');

    // Check environment variables
    console.log('📋 Configuration:');
    console.log('FROM:', process.env.EMAIL_USER);
    console.log('TO:', 'praneethp227@gmail.com');
    console.log('PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
    console.log('');

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // Send test email
    console.log('📧 Sending test email...');

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'praneethp227@gmail.com',
            subject: '✅ Test Email from SecureHealthCare',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Test Successful!</h1>
          </div>
          <div style="padding: 30px; background-color: white;">
            <p style="font-size: 16px;">Hi Praneeth,</p>
            <p>If you're seeing this email, it means the email service is working correctly! 🎉</p>
            <p>Your appointment confirmation emails should now work.</p>
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>SecureHealthCare Team</strong>
            </p>
          </div>
        </div>
      `,
            text: 'Email test successful! If you see this, the email service is working.',
        });

        console.log('✅ Email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📧 Check your inbox: praneethp227@gmail.com');
        console.log('');
        console.log('⚠️  If you don\'t see it in inbox, check SPAM folder!');
    } catch (error: any) {
        console.error('❌ Error sending email:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('\n🔧 Fix: Gmail App Password is invalid or expired');
            console.log('1. Go to: https://myaccount.google.com/apppasswords');
            console.log('2. Create new App Password');
            console.log('3. Update EMAIL_PASSWORD in .env');
            console.log('4. Restart dev server');
        }
    }
}

testEmail();
