/**
 * Quick script to add test Zoom links to today's telemedicine appointments
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestZoomLinks() {
    console.log('🔍 Finding today\'s telemedicine appointments...\n');

    const today = new Date().toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, patient_id, doctor_id, appointment_time, is_telemedicine, video_call_link')
        .eq('is_telemedicine', true)
        .eq('status', 'scheduled')
        .gte('appointment_date', today);

    if (error) {
        console.error('❌ Error fetching appointments:', error);
        return;
    }

    if (!appointments || appointments.length === 0) {
        console.log('❌ No telemedicine appointments found for today');
        return;
    }

    console.log(`📋 Found ${appointments.length} telemedicine appointment(s):\n`);

    for (const apt of appointments) {
        console.log(`📅 Appointment ${apt.id}`);
        console.log(`   Time: ${apt.appointment_time}`);
        console.log(`   Current link: ${apt.video_call_link || 'None'}`);

        // Add test Zoom link
        const testZoomLink = 'https://zoom.us/j/1234567890?pwd=test123';

        const { error: updateError } = await supabase
            .from('appointments')
            .update({ video_call_link: testZoomLink })
            .eq('id', apt.id);

        if (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}`);
        } else {
            console.log(`   ✅ Updated with test Zoom link!`);
        }
        console.log('');
    }

    console.log('✅ Done! Refresh your browser and try clicking "Join Video Call"');
    console.log('\n📝 Note: This is a test link. For real Zoom meetings, set up Zoom API credentials.');
}

addTestZoomLinks()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
