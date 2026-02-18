import { NextRequest, NextResponse } from 'next/server';
import { createZoomMeeting, isZoomConfigured } from '@/lib/zoom';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appointmentId, patientName, doctorName, duration } = body;

        console.log('[API] Creating Zoom meeting for appointment:', appointmentId);

        if (!isZoomConfigured()) {
            console.warn('[API] Zoom not configured');
            return NextResponse.json(
                { error: 'Zoom is not configured' },
                { status: 500 }
            );
        }

        const meeting = await createZoomMeeting({
            topic: 'Telemedicine Appointment',
            duration: duration || 30,
            patientName,
            doctorName,
            appointmentId,
        });

        console.log('[API] ✅ Zoom meeting created:', meeting.id);

        return NextResponse.json({
            success: true,
            meeting: {
                id: meeting.id,
                join_url: meeting.join_url,
                start_url: meeting.start_url,
                password: meeting.password,
            },
        });
    } catch (error) {
        console.error('[API] Error creating Zoom meeting:', error);
        return NextResponse.json(
            { error: 'Failed to create Zoom meeting' },
            { status: 500 }
        );
    }
}
