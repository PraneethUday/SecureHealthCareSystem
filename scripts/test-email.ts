/**
 * Test Email Service
 * Run: npx tsx scripts/test-email.ts
 */

import 'dotenv/config';
import { sendAppointmentConfirmationEmail } from '../lib/email';

async function testEmail() {
    console.log('🧪 Testing Email Service...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('');

    // Test email
    console.log('📧 Sending test email...');

    const testData = {
        patientEmail: process.env.EMAIL_USER || 'test@example.com', // Send to yourself for testing
        patientName: 'Test Patient',
        doctorName: 'Test Doctor',
        appointmentDate: '2026-02-15',
        appointmentTime: '10:00 AM',
        department: 'General Medicine',
        hospitalName: 'Test Hospital',
        isTelemedicine: true,
        zoomJoinUrl: 'https://zoom.us/j/123456789',
        appointmentId: 'TEST-123',
    };

    try {
        const result = await sendAppointmentConfirmationEmail(testData);

        if (result) {
            console.log('✅ Email sent successfully!');
            console.log(`📬 Check inbox: ${testData.patientEmail}`);
        } else {
            console.log('❌ Email failed to send');
        }
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

testEmail();
