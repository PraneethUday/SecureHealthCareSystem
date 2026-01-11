const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local or .env manually
let envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  envPath = path.join(__dirname, '.env');
}

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not found!');
  console.error('   Checked for:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.error('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  console.log('🔍 Testing Appointments Schema...\n');

  // Test hospitals table
  const { data: hospitals, error: hospitalsError } = await supabase
    .from('hospitals')
    .select('name, city')
    .limit(3);

  if (hospitalsError) {
    console.error('❌ ERROR: Hospitals table not found!');
    console.error('   Message:', hospitalsError.message);
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('   1. Open: https://supabase.com/dashboard');
    console.log('   2. Go to: SQL Editor');
    console.log('   3. Copy & Run: supabase/appointments-schema.sql\n');
    return false;
  }

  console.log(`✅ Hospitals: ${hospitals?.length || 0} found`);
  hospitals?.forEach(h => console.log(`   - ${h.name}, ${h.city}`));
  console.log('');

  // Test appointments table
  const { error: appointmentsError } = await supabase
    .from('appointments')
    .select('id')
    .limit(1);

  if (appointmentsError) {
    console.error('❌ Appointments table error:', appointmentsError.message);
    return false;
  }
  console.log('✅ Appointments table exists');

  // Test appointment_logs table
  const { error: logsError } = await supabase
    .from('appointment_logs')
    .select('id')
    .limit(1);

  if (logsError) {
    console.error('❌ Appointment logs table error:', logsError.message);
    return false;
  }
  console.log('✅ Appointment logs table exists\n');

  return true;
}

testSchema().then(success => {
  if (success) {
    console.log('✅ DATABASE SCHEMA IS DEPLOYED!\n');
    console.log('📋 Next: Test appointment booking');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Email: praneethudayakumar227@gmail.com');
    console.log('   Password: password123\n');
  }
  process.exit(success ? 0 : 1);
});
