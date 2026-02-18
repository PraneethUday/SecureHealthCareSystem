import { NextRequest, NextResponse } from 'next/server';
import {
    sendAppointmentConfirmationEmail,
    sendDoctorAppointmentNotification,
} from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        console.log('[API] Sending email notification:', type);

        if (type === 'appointment_confirmation') {
            const success = await sendAppointmentConfirmationEmail(data);

            if (success) {
                console.log('[API] ✅ Patient confirmation email sent');
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json(
                    { success: false, error: 'Failed to send email' },
                    { status: 500 }
                );
            }
        } else if (type === 'doctor_notification') {
            const success = await sendDoctorAppointmentNotification(data);

            if (success) {
                console.log('[API] ✅ Doctor notification email sent');
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json(
                    { success: false, error: 'Failed to send email' },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid email type' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('[API] Error sending email:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
