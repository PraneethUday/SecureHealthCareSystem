/**
 * 🧪 Vitals API Testing Script
 * Comprehensive testing for patient vitals endpoints
 * 
 * Run: npx tsx scripts/test-vitals.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test results
const results = {
    total: 0,
    passed: 0,
    failed: 0,
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

function logInfo(text: string) {
    console.log(colors.cyan + '  ℹ️  ' + text + colors.reset);
}

function logWarning(text: string) {
    console.log(colors.yellow + '  ⚠️  ' + text + colors.reset);
}

function logData(label: string, data: any) {
    console.log(colors.magenta + `  📊 ${label}:` + colors.reset);
    console.log('     ' + JSON.stringify(data, null, 2).replace(/\n/g, '\n     '));
}

// Test functions
async function testDatabaseConnection() {
    results.total++;
    logSection('🔌 DATABASE CONNECTION TEST');

    try {
        const { data, error } = await supabase.from('patients').select('count').limit(1);

        if (error) {
            logError(`Database connection failed: ${error.message}`);
            return false;
        }

        logSuccess('Database connection successful');
        return true;
    } catch (error: any) {
        logError(`Database connection error: ${error.message}`);
        return false;
    }
}

async function testGetPatient() {
    results.total++;
    logSection('👤 GET PATIENT TEST');

    try {
        logInfo('Fetching first patient from database...');

        const { data: patients, error } = await supabase
            .from('patients')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            logError(`Failed to fetch patient: ${error.message}`);
            return null;
        }

        if (!patients) {
            logWarning('No patients found in database');
            logInfo('Create a patient first to test vitals');
            return null;
        }

        logSuccess('Patient fetched successfully');
        logData('Patient', {
            id: patients.id,
            name: `${patients.first_name} ${patients.last_name}`,
            email: patients.email,
        });

        return patients.id;
    } catch (error: any) {
        logError(`Error fetching patient: ${error.message}`);
        return null;
    }
}

async function testCreateVitals(patientId: string) {
    results.total++;
    logSection('➕ CREATE VITALS TEST');

    const testVitals = {
        patient_id: patientId,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        heart_rate: 72,
        temperature: 98.6,
        oxygen_saturation: 98,
        weight: 70.5,
        height: 175,
        recorded_at: new Date().toISOString(),
    };

    try {
        logInfo('Creating test vitals record...');
        logData('Test Data', testVitals);

        const { data, error } = await supabase
            .from('vitals')
            .insert(testVitals)
            .select()
            .single();

        if (error) {
            logError(`Failed to create vitals: ${error.message}`);
            return null;
        }

        logSuccess('Vitals created successfully');
        logData('Created Vitals', data);

        return data.id;
    } catch (error: any) {
        logError(`Error creating vitals: ${error.message}`);
        return null;
    }
}

async function testGetVitals(patientId: string) {
    results.total++;
    logSection('📊 GET VITALS TEST');

    try {
        logInfo(`Fetching vitals for patient: ${patientId}`);

        const { data, error } = await supabase
            .from('vitals')
            .select('*')
            .eq('patient_id', patientId)
            .order('recorded_at', { ascending: false });

        if (error) {
            logError(`Failed to fetch vitals: ${error.message}`);
            return false;
        }

        if (!data || data.length === 0) {
            logWarning('No vitals found for this patient');
            return false;
        }

        logSuccess(`Found ${data.length} vitals record(s)`);
        logData('Latest Vitals', data[0]);

        return true;
    } catch (error: any) {
        logError(`Error fetching vitals: ${error.message}`);
        return false;
    }
}

async function testUpdateVitals(vitalsId: string) {
    results.total++;
    logSection('✏️  UPDATE VITALS TEST');

    const updates = {
        heart_rate: 75,
        temperature: 98.8,
    };

    try {
        logInfo(`Updating vitals record: ${vitalsId}`);
        logData('Updates', updates);

        const { data, error } = await supabase
            .from('vitals')
            .update(updates)
            .eq('id', vitalsId)
            .select()
            .single();

        if (error) {
            logError(`Failed to update vitals: ${error.message}`);
            return false;
        }

        logSuccess('Vitals updated successfully');
        logData('Updated Vitals', data);

        return true;
    } catch (error: any) {
        logError(`Error updating vitals: ${error.message}`);
        return false;
    }
}

async function testDeleteVitals(vitalsId: string) {
    results.total++;
    logSection('🗑️  DELETE VITALS TEST');

    try {
        logInfo(`Deleting vitals record: ${vitalsId}`);

        const { error } = await supabase
            .from('vitals')
            .delete()
            .eq('id', vitalsId);

        if (error) {
            logError(`Failed to delete vitals: ${error.message}`);
            return false;
        }

        logSuccess('Vitals deleted successfully');

        return true;
    } catch (error: any) {
        logError(`Error deleting vitals: ${error.message}`);
        return false;
    }
}

async function testVitalsValidation() {
    results.total++;
    logSection('✔️  VITALS VALIDATION TEST');

    const invalidVitals = {
        patient_id: 'invalid-patient-id',
        blood_pressure_systolic: -10, // Invalid: negative
        heart_rate: 300, // Invalid: too high
        temperature: 150, // Invalid: too high
    };

    try {
        logInfo('Testing with invalid data...');
        logData('Invalid Data', invalidVitals);

        const { data, error } = await supabase
            .from('vitals')
            .insert(invalidVitals)
            .select();

        if (error) {
            logSuccess('Validation working: Invalid data rejected');
            logInfo(`Error message: ${error.message}`);
            return true;
        }

        logWarning('Validation not working: Invalid data was accepted');

        // Clean up if it was inserted
        if (data && data[0]) {
            await supabase.from('vitals').delete().eq('id', data[0].id);
        }

        return false;
    } catch (error: any) {
        logSuccess('Validation working: Invalid data rejected');
        return true;
    }
}

async function testVitalsStatistics(patientId: string) {
    results.total++;
    logSection('📈 VITALS STATISTICS TEST');

    try {
        logInfo('Calculating vitals statistics...');

        const { data, error } = await supabase
            .from('vitals')
            .select('heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature')
            .eq('patient_id', patientId);

        if (error) {
            logError(`Failed to fetch vitals for statistics: ${error.message}`);
            return false;
        }

        if (!data || data.length === 0) {
            logWarning('No vitals data for statistics');
            return false;
        }

        // Calculate averages
        const stats = {
            totalRecords: data.length,
            avgHeartRate: (data.reduce((sum, v) => sum + (v.heart_rate || 0), 0) / data.length).toFixed(1),
            avgSystolic: (data.reduce((sum, v) => sum + (v.blood_pressure_systolic || 0), 0) / data.length).toFixed(1),
            avgDiastolic: (data.reduce((sum, v) => sum + (v.blood_pressure_diastolic || 0), 0) / data.length).toFixed(1),
            avgTemperature: (data.reduce((sum, v) => sum + (v.temperature || 0), 0) / data.length).toFixed(1),
        };

        logSuccess('Statistics calculated successfully');
        logData('Statistics', stats);

        return true;
    } catch (error: any) {
        logError(`Error calculating statistics: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runVitalsTests() {
    console.clear();
    logHeader('❤️  VITALS API COMPREHENSIVE TESTING SUITE');

    console.log(colors.bright + 'Configuration:' + colors.reset);
    logInfo(`Supabase URL: ${supabaseUrl}`);
    logInfo(`Service Role Key: ${supabaseKey ? '✅ Set' : '❌ Not set'}`);

    // Test 1: Database Connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        logError('Cannot proceed without database connection');
        return;
    }

    // Test 2: Get Patient
    const patientId = await testGetPatient();
    if (!patientId) {
        logWarning('Cannot test vitals without a patient');
        logInfo('Please create a patient first');
        return;
    }

    // Test 3: Create Vitals
    const vitalsId = await testCreateVitals(patientId);

    if (vitalsId) {
        // Test 4: Get Vitals
        await testGetVitals(patientId);

        // Test 5: Update Vitals
        await testUpdateVitals(vitalsId);

        // Test 6: Statistics
        await testVitalsStatistics(patientId);

        // Test 7: Delete Vitals (cleanup)
        await testDeleteVitals(vitalsId);
    }

    // Test 8: Validation
    await testVitalsValidation();

    // Summary
    logHeader('📊 TEST SUMMARY');

    console.log(colors.bright + '\nResults:' + colors.reset);
    console.log(colors.green + `  ✅ Passed:  ${results.passed}` + colors.reset);
    console.log(colors.red + `  ❌ Failed:  ${results.failed}` + colors.reset);
    console.log(colors.cyan + `  📊 Total:   ${results.total}` + colors.reset);

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    console.log(`\n${colors.bright}Success Rate: ${successRate}%${colors.reset}`);

    if (results.failed === 0) {
        console.log(colors.green + '\n🎉 All vitals tests passed! Your vitals system is working correctly!' + colors.reset);
    } else {
        console.log(colors.yellow + '\n⚠️  Some tests failed. Check the logs above for details.' + colors.reset);
    }

    // Recommendations
    logHeader('💡 RECOMMENDATIONS');

    if (results.passed === results.total) {
        logSuccess('Vitals system is fully functional');
        logInfo('You can now:');
        console.log('     - Record patient vitals from the dashboard');
        console.log('     - View vitals history');
        console.log('     - Track health trends');
        console.log('     - Generate health reports');
    } else {
        logWarning('Some vitals features may not be working correctly');
        logInfo('Check the failed tests above and fix the issues');
    }

    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80) + colors.reset);
    console.log(colors.bright + colors.cyan + '  Vitals Testing Complete!' + colors.reset);
    console.log(colors.bright + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

// Run the tests
runVitalsTests().catch((error) => {
    console.error(colors.red + '\n❌ Fatal Error:' + colors.reset, error);
    process.exit(1);
});
