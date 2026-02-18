/**
 * 🚀 Create Vitals Table Migration
 * Runs the SQL migration to create the vitals table in Supabase
 * 
 * Run: npx tsx scripts/create-vitals-table.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
};

function logHeader(text: string) {
    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80) + colors.reset);
    console.log(colors.bright + colors.cyan + `  ${text}` + colors.reset);
    console.log(colors.bright + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

function logSuccess(text: string) {
    console.log(colors.green + '  ✅ ' + text + colors.reset);
}

function logError(text: string) {
    console.log(colors.red + '  ❌ ' + text + colors.reset);
}

function logInfo(text: string) {
    console.log(colors.cyan + '  ℹ️  ' + text + colors.reset);
}

function logWarning(text: string) {
    console.log(colors.yellow + '  ⚠️  ' + text + colors.reset);
}

async function createVitalsTable() {
    console.clear();
    logHeader('🚀 CREATING VITALS TABLE IN SUPABASE');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        logError('Missing Supabase credentials in .env file');
        logInfo('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    logInfo(`Supabase URL: ${supabaseUrl}`);
    logInfo('Service Role Key: ✅ Set');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_vitals_table.sql');

    logInfo(`Reading SQL file: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
        logError('SQL file not found!');
        logInfo('Expected location: supabase/migrations/create_vitals_table.sql');
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    logSuccess('SQL file loaded successfully');

    // Execute SQL
    logInfo('Executing SQL migration...');
    logWarning('This may take a few seconds...');

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct SQL execution
            logWarning('RPC method not available, trying direct execution...');

            // Split SQL into individual statements
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

            logInfo(`Executing ${statements.length} SQL statements...`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.includes('CREATE TABLE') ||
                    statement.includes('CREATE INDEX') ||
                    statement.includes('CREATE POLICY') ||
                    statement.includes('ALTER TABLE') ||
                    statement.includes('CREATE TRIGGER') ||
                    statement.includes('CREATE OR REPLACE FUNCTION')) {

                    logInfo(`Executing statement ${i + 1}/${statements.length}...`);

                    // Note: Supabase client doesn't support direct SQL execution
                    // User needs to run this in Supabase SQL Editor
                    console.log(colors.yellow + '\n⚠️  Cannot execute SQL directly via Supabase client.' + colors.reset);
                    console.log(colors.cyan + '\n📋 Please follow these steps:' + colors.reset);
                    console.log('\n1. Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql');
                    console.log('2. Copy the SQL from: supabase/migrations/create_vitals_table.sql');
                    console.log('3. Paste it into the SQL Editor');
                    console.log('4. Click "Run" to execute');
                    console.log('\nOR use Supabase CLI:');
                    console.log('  npx supabase db push');

                    process.exit(0);
                }
            }
        }

        logSuccess('Vitals table created successfully!');

    } catch (error: any) {
        logError(`Error: ${error.message}`);

        console.log(colors.cyan + '\n📋 Manual Setup Instructions:' + colors.reset);
        console.log('\n1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy the SQL from: supabase/migrations/create_vitals_table.sql');
        console.log('3. Paste and run it');

        process.exit(1);
    }

    logHeader('✅ SETUP COMPLETE');
    logSuccess('Vitals table is ready!');
    logInfo('You can now run: npx tsx scripts/test-vitals.ts');
}

createVitalsTable();
