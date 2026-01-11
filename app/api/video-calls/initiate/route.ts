import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    );

    const { appointmentId, doctorId, userId, userRole } = await request.json();

    console.log('[API] Video call initiate request:', { appointmentId, doctorId, userId, userRole });

    // Verify user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is patient
    if (userRole !== 'patient') {
      return NextResponse.json(
        { error: 'Only patients can initiate video calls' },
        { status: 403 }
      );
    }

    // Verify appointment exists and belongs to patient
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, status')
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      console.error('[API] Appointment not found:', { appointmentId, error: aptError });
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    console.log('[API] Appointment found:', { appointment });

    if (appointment.patient_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: this is not your appointment' },
        { status: 403 }
      );
    }

    if (appointment.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Can only call for scheduled appointments' },
        { status: 400 }
      );
    }

    if (appointment.doctor_id !== doctorId) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    // Create video call record
    console.log('[API] Creating video call record for doctor:', doctorId);
    const { data: videoCall, error: createError } = await supabase
      .from('video_calls')
      .insert({
        appointment_id: appointmentId,
        patient_id: userId,
        doctor_id: doctorId,
        status: 'calling',
        initiated_by_role: 'patient',
      })
      .select()
      .single();

    if (createError || !videoCall) {
      console.error('[API] Error creating video call:', createError);
      return NextResponse.json(
        { error: 'Failed to create video call' },
        { status: 500 }
      );
    }

    console.log(`[API] Video call created successfully:`, videoCall);

    return NextResponse.json({
      success: true,
      callId: videoCall.id,
      appointment: appointment,
    });
  } catch (error) {
    console.error('[API] Error initiating video call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
