/**
 * Quick test to check if Zoom is configured correctly
 */

import { isZoomConfigured, createZoomMeeting } from '../lib/zoom';

async function testZoom() {
    console.log('🔍 Testing Zoom Configuration...\n');

    // Check if credentials are set
    console.log('1. Checking environment variables...');
    console.log('   ZOOM_ACCOUNT_ID:', process.env.ZOOM_ACCOUNT_ID ? '✅ Set' : '❌ Not set');
    console.log('   ZOOM_CLIENT_ID:', process.env.ZOOM_CLIENT_ID ? '✅ Set' : '❌ Not set');
    console.log('   ZOOM_CLIENT_SECRET:', process.env.ZOOM_CLIENT_SECRET ? '✅ Set' : '❌ Not set');

    if (!isZoomConfigured()) {
        console.log('\n❌ Zoom is NOT configured!');
        console.log('\n📝 To fix this:');
        console.log('   1. Go to https://marketplace.zoom.us/');
        console.log('   2. Create a Server-to-Server OAuth app');
        console.log('   3. Add credentials to .env file:');
        console.log('      ZOOM_ACCOUNT_ID=your_account_id');
        console.log('      ZOOM_CLIENT_ID=your_client_id');
        console.log('      ZOOM_CLIENT_SECRET=your_client_secret');
        console.log('   4. Restart your dev server');
        return;
    }

    console.log('\n✅ Zoom credentials are configured!');
    console.log('\n2. Testing Zoom API connection...');

    try {
        const meeting = await createZoomMeeting({
            topic: 'Test Meeting',
            duration: 30,
            patientName: 'Test Patient',
            doctorName: 'Test Doctor',
            appointmentId: 'test-123',
        });

        console.log('\n✅ SUCCESS! Zoom is working!');
        console.log('\n📋 Test Meeting Details:');
        console.log('   Meeting ID:', meeting.id);
        console.log('   Join URL:', meeting.join_url);
        console.log('   Host URL:', meeting.start_url);
        console.log('   Password:', meeting.password || 'None');
        console.log('\n🎉 You can now create Zoom meetings for appointments!');
    } catch (error) {
        console.error('\n❌ ERROR: Failed to create Zoom meeting');
        console.error('   Error:', error instanceof Error ? error.message : error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check if your Zoom app is activated');
        console.log('   2. Verify the credentials are correct');
        console.log('   3. Make sure you added the required scopes:');
        console.log('      - meeting:write:admin');
        console.log('      - meeting:update:admin');
        console.log('      - meeting:delete:admin');
    }
}

testZoom()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
