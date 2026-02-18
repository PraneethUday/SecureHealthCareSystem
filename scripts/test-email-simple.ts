import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testEmail() {
    console.log('Testing Email (Nodemailer)...');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass exists:', !!process.env.EMAIL_PASSWORD);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {
        console.log('Sending test email...');
        await transporter.sendMail({
            from: `"SecureHealthCare Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from SecureHealthCare',
            text: 'If you see this, your email configuration is correct!',
        });
        console.log('✅ Email sent successfully!');
    } catch (err) {
        console.error('❌ Error sending email:', err);
    }
}

testEmail();
