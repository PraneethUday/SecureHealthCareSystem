/**
 * Zoom Meeting Integration
 * Simple, reliable video calls using Zoom API
 */

import axios from 'axios';

// Zoom API Configuration
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || '';
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID || '';
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET || '';

interface ZoomMeeting {
    id: string;
    topic: string;
    start_url: string; // Host URL
    join_url: string;  // Participant URL
    password?: string;
    duration: number;
    created_at: string;
}

interface CreateMeetingOptions {
    topic: string;
    duration?: number; // in minutes
    patientName: string;
    doctorName: string;
    appointmentId: string;
}

/**
 * Get Zoom OAuth token using Server-to-Server OAuth
 */
async function getZoomAccessToken(): Promise<string> {
    try {
        const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            {},
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data.access_token;
    } catch (error) {
        console.error('[Zoom] Error getting access token:', error);
        throw new Error('Failed to authenticate with Zoom');
    }
}

/**
 * Create a Zoom meeting for an appointment
 */
export async function createZoomMeeting(options: CreateMeetingOptions): Promise<ZoomMeeting> {
    try {
        console.log('[Zoom] Creating meeting for appointment:', options.appointmentId);

        const accessToken = await getZoomAccessToken();

        const meetingData = {
            topic: options.topic || `Appointment: ${options.patientName} with Dr. ${options.doctorName}`,
            type: 2, // Scheduled meeting
            duration: options.duration || 30,
            timezone: 'Asia/Kolkata',
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false, // Doctor must join first
                mute_upon_entry: false,
                waiting_room: true, // HIPAA requirement - patient waits for doctor
                audio: 'both',
                auto_recording: 'cloud', // Record for medical records
                approval_type: 0, // Automatically approve
                encryption_type: 'enhanced_encryption', // HIPAA compliance
                meeting_authentication: false, // Set to false so patients can join directly without a Zoom account
            },
        };

        const response = await axios.post(
            `${ZOOM_API_BASE_URL}/users/me/meetings`,
            meetingData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const meeting: ZoomMeeting = {
            id: response.data.id.toString(),
            topic: response.data.topic,
            start_url: response.data.start_url,
            join_url: response.data.join_url,
            password: response.data.password,
            duration: response.data.duration,
            created_at: response.data.created_at,
        };

        console.log('[Zoom] ✅ Meeting created successfully:', meeting.id);
        return meeting;
    } catch (error: any) {
        console.error('[Zoom] Error creating meeting:', error.response?.data || error.message);
        throw new Error('Failed to create Zoom meeting');
    }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string): Promise<boolean> {
    try {
        const accessToken = await getZoomAccessToken();

        await axios.delete(
            `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        console.log('[Zoom] Meeting deleted:', meetingId);
        return true;
    } catch (error) {
        console.error('[Zoom] Error deleting meeting:', error);
        return false;
    }
}

/**
 * Get meeting details
 */
export async function getZoomMeeting(meetingId: string): Promise<ZoomMeeting | null> {
    try {
        const accessToken = await getZoomAccessToken();

        const response = await axios.get(
            `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        return {
            id: response.data.id.toString(),
            topic: response.data.topic,
            start_url: response.data.start_url,
            join_url: response.data.join_url,
            password: response.data.password,
            duration: response.data.duration,
            created_at: response.data.created_at,
        };
    } catch (error) {
        console.error('[Zoom] Error getting meeting:', error);
        return null;
    }
}

/**
 * Generate a simple meeting link (alternative to full API)
 * This creates an instant meeting URL without API calls
 */
export function generateSimpleZoomLink(appointmentId: string): string {
    // For development/testing - generates a Zoom personal meeting room link
    // In production, use the full API above
    const baseUrl = 'https://zoom.us/j/';
    const meetingId = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `${baseUrl}${meetingId}?pwd=${appointmentId.substring(0, 8)}`;
}

/**
 * Check if Zoom is configured
 */
export function isZoomConfigured(): boolean {
    return !!(ZOOM_ACCOUNT_ID && ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET);
}
