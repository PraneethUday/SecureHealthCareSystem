/**
 * Script to add Zoom links to existing telemedicine appointments
 * Run this once after setting up Zoom integration
 */

import { createClient } from '@supabase/supabase-js';
import { createZoomMeeting, isZoomConfigured } from '../lib/zoom';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addZoomToExistingAppointments() {
    console.log('🔍 Checking for telemedicine appointments without Zoom links...');

    if (!isZoomConfigured()) {
        console.error('❌ Zoom is not configured. Please add Zoom credentials to .env');
        console.error('   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET');
        return;
    }

    // Get all scheduled telemedicine appointments without Zoom links
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
      id,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      is_telemedicine,
      zoom_meeting_id,
      patients!inner(first_name, last_name),
      doctors!inner(first_name, last_name)
    `)
        .eq('is_telemedicine', true)
        .eq('status', 'scheduled')
        .is('zoom_meeting_id', null)
        .gte('appointment_date', new Date().toISOString().split('T')[0]); // Only future appointments

    if (error) {
        console.error('❌ Error fetching appointments:', error);
        return;
    }

    if (!appointments || appointments.length === 0) {
        console.log('✅ No appointments need Zoom links!');
        return;
    }

    console.log(`📋 Found ${appointments.length} appointment(s) that need Zoom links`);

    let successCount = 0;
    let failCount = 0;

    for (const appointment of appointments) {
        try {
            console.log(`\n📅 Processing appointment ${appointment.id}...`);

            const patientData = appointment.patients as any;
            const doctorData = appointment.doctors as any;

            const patientName = `${patientData.first_name} ${patientData.last_name}`;
            const doctorName = `${doctorData.first_name} ${doctorData.last_name}`;

            // Create Zoom meeting
            const zoomMeeting = await createZoomMeeting({
                topic: 'Telemedicine Appointment',
                duration: appointment.duration_minutes || 30,
                patientName,
                doctorName,
                appointmentId: appointment.id,
            });

            // Update appointment with Zoom details
            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    zoom_meeting_id: zoomMeeting.id,
                    zoom_host_url: zoomMeeting.start_url,
                    zoom_join_url: zoomMeeting.join_url,
                    zoom_password: zoomMeeting.password,
                    zoom_created_at: new Date().toISOString(),
                    video_call_link: zoomMeeting.join_url, // Backward compatibility
                })
                .eq('id', appointment.id);

            if (updateError) {
                console.error(`   ❌ Error updating appointment:`, updateError);
                failCount++;
            } else {
                console.log(`   ✅ Zoom meeting created: ${zoomMeeting.id}`);
                console.log(`   📍 Join URL: ${zoomMeeting.join_url}`);
                successCount++;
            }
        } catch (error) {
            console.error(`   ❌ Error creating Zoom meeting:`, error);
            failCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📋 Total: ${appointments.length}`);
}

// Run the script
addZoomToExistingAppointments()
    .then(() => {
        console.log('\n✅ Script completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
