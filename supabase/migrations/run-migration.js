/**
 * Migration Script: Add share_health_profile column
 * Run this with: node supabase/migrations/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🔄 Running migration: Add share_health_profile column...\n');

    try {
        // Check if column exists
        const { data: columns, error: checkError } = await supabase
            .from('appointments')
            .select('share_health_profile')
            .limit(1);

        if (!checkError) {
            console.log('✅ Column share_health_profile already exists!');
            console.log('   No migration needed.');
            return;
        }

        // If we get here, column doesn't exist, so we need to add it
        console.log('📝 Column does not exist. Adding it now...');

        const { error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE appointments 
        ADD COLUMN IF NOT EXISTS share_health_profile BOOLEAN DEFAULT false;
      `
        });

        if (error) {
            // Try alternative method using raw SQL
            console.log('⚠️  RPC method failed. Please run the migration manually.');
            console.log('\n📋 Copy and paste this SQL into your Supabase SQL Editor:\n');
            console.log('----------------------------------------');
            console.log('ALTER TABLE appointments');
            console.log('ADD COLUMN IF NOT EXISTS share_health_profile BOOLEAN DEFAULT false;');
            console.log('----------------------------------------\n');
            console.log('🔗 Go to: https://supabase.com/dashboard/project/lkgzfyrrkkchmlivrdec/sql/new');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('   Column share_health_profile added to appointments table.');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
        console.log('----------------------------------------');
        console.log('ALTER TABLE appointments');
        console.log('ADD COLUMN IF NOT EXISTS share_health_profile BOOLEAN DEFAULT false;');
        console.log('----------------------------------------\n');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/lkgzfyrrkkchmlivrdec/sql/new');
        process.exit(1);
    }
}

runMigration();
