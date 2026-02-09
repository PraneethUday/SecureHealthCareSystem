/**
 * Check Doctor Database Records
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

import { supabaseAdmin } from '../lib/supabase-admin';

async function checkDoctorData() {
  console.log('🔍 Checking doctor records in database...\n');

  const { data: doctors, error } = await supabaseAdmin
    .from('doctors')
    .select('*')
    .in('doctor_id', ['D001', 'D002', 'D003'])
    .order('doctor_id');

  if (error) {
    console.error('❌ Error fetching doctors:', error);
    return;
  }

  if (!doctors || doctors.length === 0) {
    console.log('⚠️ No doctors found with IDs D001, D002, D003');
    return;
  }

  console.log(`Found ${doctors.length} doctor(s):\n`);

  doctors.forEach((doc) => {
    console.log(`Doctor ID: ${doc.doctor_id}`);
    console.log(`  Name: ${doc.first_name} ${doc.last_name}`);
    console.log(`  Email: ${doc.email}`);
    console.log(`  Specialization: ${doc.specialization}`);
    console.log(`  Password field: ${doc.password ? `"${doc.password}"` : 'NULL'}`);
    console.log(`  Password length: ${doc.password ? doc.password.length : 0}`);
    console.log(`  Password hash: ${doc.password_hash ? 'EXISTS (hashed)' : 'NULL'}`);
    console.log(`  Is locked: ${doc.is_locked}`);
    console.log(`  Login attempts: ${doc.login_attempts}`);
    console.log(`  MFA enabled: ${doc.is_mfa_enabled}`);
    console.log(`  Last login: ${doc.last_login || 'Never'}`);
    console.log('---');
  });

  // Test password comparisons
  console.log('\n🧪 Testing password comparisons:\n');
  const testPasswords = {
    'D001': 'doctor1',
    'D002': 'doctor2',
    'D003': 'doctor3',
  };

  doctors.forEach((doc) => {
    const testPwd = testPasswords[doc.doctor_id as keyof typeof testPasswords];
    const matches = doc.password === testPwd;
    console.log(`${doc.doctor_id}: "${testPwd}" === "${doc.password}" ? ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
  });
}

checkDoctorData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
