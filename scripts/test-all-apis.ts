/**
 * 🧪 SecureHealthCare API Endpoint Tester
 * Tests all major API endpoints and displays results with clear logs
 * 
 * Run: npx tsx scripts/test-all-apis.ts
 */

import 'dotenv/config';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test results tracker
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
};

// Helper functions
function logHeader(text: string) {
    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80) + colors.reset);
    console.log(colors.bright + colors.cyan + `  ${text}` + colors.reset);
    console.log(colors.bright + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

function logSection(text: string) {
    console.log('\n' + colors.bright + colors.blue + '─'.repeat(80) + colors.reset);
    console.log(colors.bright + colors.blue + `  ${text}` + colors.reset);
    console.log(colors.bright + colors.blue + '─'.repeat(80) + colors.reset);
}

function logSuccess(text: string) {
    console.log(colors.green + '  ✅ ' + text + colors.reset);
    results.passed++;
}

function logError(text: string) {
    console.log(colors.red + '  ❌ ' + text + colors.reset);
    results.failed++;
}

function logWarning(text: string) {
    console.log(colors.yellow + '  ⚠️  ' + text + colors.reset);
}

function logInfo(text: string) {
    console.log(colors.cyan + '  ℹ️  ' + text + colors.reset);
}

function logSkip(text: string) {
    console.log(colors.yellow + '  ⏭️  ' + text + colors.reset);
    results.skipped++;
}

// Test individual endpoint
async function testEndpoint(
    name: string,
    method: string,
    endpoint: string,
    body?: any,
    expectedStatus: number = 200
): Promise<boolean> {
    results.total++;

    try {
        console.log(`\n${colors.bright}Testing: ${name}${colors.reset}`);
        logInfo(`${method} ${endpoint}`);

        if (body) {
            logInfo(`Payload: ${JSON.stringify(body, null, 2)}`);
        }

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json().catch(() => null);

        if (response.status === expectedStatus) {
            logSuccess(`Status: ${response.status} ${response.statusText}`);
            if (data) {
                logSuccess(`Response: ${JSON.stringify(data, null, 2)}`);
            }
            return true;
        } else {
            logError(`Expected status ${expectedStatus}, got ${response.status}`);
            if (data) {
                logError(`Response: ${JSON.stringify(data, null, 2)}`);
            }
            return false;
        }
    } catch (error: any) {
        logError(`Error: ${error.message}`);
        return false;
    }
}

// Main test suite
async function runTests() {
    logHeader('🧪 SECUREHEALTHCARE API ENDPOINT TESTING SUITE');

    console.log(colors.bright + 'Configuration:' + colors.reset);
    logInfo(`API Base URL: ${API_BASE_URL}`);
    logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // ============================================================================
    // ZOOM API TESTS
    // ============================================================================
    logSection('🎥 ZOOM API ENDPOINTS');

    await testEndpoint(
        'Create Zoom Meeting',
        'POST',
        '/api/zoom/create-meeting',
        {
            appointmentId: 'test-123',
            patientName: 'Test Patient',
            doctorName: 'Test Doctor',
            duration: 30,
        }
    );

    // ============================================================================
    // EMAIL API TESTS
    // ============================================================================
    logSection('📧 EMAIL API ENDPOINTS');

    await testEndpoint(
        'Send Patient Confirmation Email',
        'POST',
        '/api/email/send',
        {
            type: 'appointment_confirmation',
            data: {
                patientEmail: 'praneethp227@gmail.com',
                patientName: 'Praneeth',
                doctorName: 'Dr. Rajesh Kumar',
                appointmentDate: '2026-02-15',
                appointmentTime: '10:00 AM',
                department: 'Cardiology',
                hospitalName: 'Apollo Hospitals',
                isTelemedicine: true,
                zoomJoinUrl: 'https://zoom.us/j/123456789',
                appointmentId: 'TEST-123',
            },
        }
    );

    await testEndpoint(
        'Send Doctor Notification Email',
        'POST',
        '/api/email/send',
        {
            type: 'doctor_notification',
            data: {
                doctorEmail: 'doctor@example.com',
                doctorName: 'Rajesh Kumar',
                patientName: 'Praneeth',
                appointmentDate: '2026-02-15',
                appointmentTime: '10:00 AM',
                department: 'Cardiology',
                hospitalName: 'Apollo Hospitals',
                isTelemedicine: true,
                zoomHostUrl: 'https://zoom.us/s/123456789',
                appointmentId: 'TEST-123',
                reason: 'Regular checkup',
            },
        }
    );

    // ============================================================================
    // VITALS API TESTS (if exists)
    // ============================================================================
    logSection('❤️  VITALS API ENDPOINTS');

    // Note: These endpoints might not exist yet, so we'll test if they're available
    logInfo('Testing vitals endpoints...');

    // Test GET vitals
    const vitalsGetTest = await testEndpoint(
        'Get Patient Vitals',
        'GET',
        '/api/vitals?patientId=test-patient-id'
    ).catch(() => {
        logSkip('GET /api/vitals - Endpoint not implemented yet');
        return false;
    });

    // Test POST vitals
    const vitalsPostTest = await testEndpoint(
        'Create Patient Vitals',
        'POST',
        '/api/vitals',
        {
            patientId: 'test-patient-id',
            bloodPressureSystolic: 120,
            bloodPressureDiastolic: 80,
            heartRate: 72,
            temperature: 98.6,
            oxygenSaturation: 98,
            weight: 70,
            height: 175,
            recordedAt: new Date().toISOString(),
        }
    ).catch(() => {
        logSkip('POST /api/vitals - Endpoint not implemented yet');
        return false;
    });

    // ============================================================================
    // AUTHENTICATION API TESTS
    // ============================================================================
    logSection('🔐 AUTHENTICATION API ENDPOINTS');

    logInfo('Auth endpoints typically require NextAuth setup');
    logSkip('POST /api/auth/signin - Requires NextAuth session');
    logSkip('POST /api/auth/signout - Requires NextAuth session');
    logSkip('GET /api/auth/session - Requires NextAuth session');

    // ============================================================================
    // HEALTH CHECK
    // ============================================================================
    logSection('🏥 HEALTH CHECK');

    // Test if server is running
    try {
        const response = await fetch(API_BASE_URL);
        if (response.ok) {
            logSuccess(`Server is running at ${API_BASE_URL}`);
            results.passed++;
        } else {
            logWarning(`Server responded with status ${response.status}`);
        }
    } catch (error) {
        logError(`Cannot connect to server at ${API_BASE_URL}`);
        logWarning('Make sure dev server is running: npm run dev');
        results.failed++;
    }
    results.total++;

    // ============================================================================
    // ENVIRONMENT VARIABLES CHECK
    // ============================================================================
    logSection('🔧 ENVIRONMENT VARIABLES');

    const envVars = [
        { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
        { name: 'ZOOM_ACCOUNT_ID', value: process.env.ZOOM_ACCOUNT_ID },
        { name: 'ZOOM_CLIENT_ID', value: process.env.ZOOM_CLIENT_ID },
        { name: 'ZOOM_CLIENT_SECRET', value: process.env.ZOOM_CLIENT_SECRET },
        { name: 'EMAIL_USER', value: process.env.EMAIL_USER },
        { name: 'EMAIL_PASSWORD', value: process.env.EMAIL_PASSWORD },
        { name: 'NEXTAUTH_URL', value: process.env.NEXTAUTH_URL },
        { name: 'NEXTAUTH_SECRET', value: process.env.NEXTAUTH_SECRET },
    ];

    envVars.forEach(({ name, value }) => {
        if (value) {
            logSuccess(`${name}: ✅ Set`);
        } else {
            logWarning(`${name}: ⚠️  Not set`);
        }
    });

    // ============================================================================
    // SUMMARY
    // ============================================================================
    logHeader('📊 TEST SUMMARY');

    console.log(colors.bright + '\nResults:' + colors.reset);
    console.log(colors.green + `  ✅ Passed:  ${results.passed}` + colors.reset);
    console.log(colors.red + `  ❌ Failed:  ${results.failed}` + colors.reset);
    console.log(colors.yellow + `  ⏭️  Skipped: ${results.skipped}` + colors.reset);
    console.log(colors.cyan + `  📊 Total:   ${results.total}` + colors.reset);

    const successRate = ((results.passed / (results.total - results.skipped)) * 100).toFixed(1);
    console.log(`\n${colors.bright}Success Rate: ${successRate}%${colors.reset}`);

    if (results.failed === 0) {
        console.log(colors.green + '\n🎉 All tests passed! Your API is working correctly!' + colors.reset);
    } else {
        console.log(colors.yellow + '\n⚠️  Some tests failed. Check the logs above for details.' + colors.reset);
    }

    // ============================================================================
    // RECOMMENDATIONS
    // ============================================================================
    logHeader('💡 RECOMMENDATIONS');

    if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID) {
        logWarning('Zoom credentials not configured. Telemedicine features will not work.');
        logInfo('Add Zoom credentials to .env file');
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logWarning('Email credentials not configured. Email notifications will not work.');
        logInfo('Add email credentials to .env file');
    }

    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80) + colors.reset);
    console.log(colors.bright + colors.cyan + '  Testing Complete!' + colors.reset);
    console.log(colors.bright + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

// Run the tests
console.clear();
runTests().catch((error) => {
    console.error(colors.red + '\n❌ Fatal Error:' + colors.reset, error);
    process.exit(1);
});
