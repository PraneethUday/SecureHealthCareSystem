const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointmentCreation() {
  console.log('🧪 Testing Appointment Creation...\n');

  // Step 1: Get a patient
  const { data: patients, error: patientError } = await supabase
    .from('patients')
    .select('id, patient_id, first_name, last_name')
    .limit(1);

  if (patientError || !patients || patients.length === 0) {
    console.error('❌ No patients found');
    return false;
  }

  const patient = patients[0];
  console.log(`✅ Found patient: ${patient.first_name} ${patient.last_name} (${patient.patient_id})`);
  console.log(`   UUID: ${patient.id}\n`);

  // Step 2: Get a doctor
  const { data: doctors, error: doctorError } = await supabase
    .from('doctors')
    .select('id, doctor_id, first_name, last_name, specialization')
    .limit(1);

  if (doctorError || !doctors || doctors.length === 0) {
    console.error('❌ No doctors found');
    return false;
  }

  const doctor = doctors[0];
  console.log(`✅ Found doctor: Dr. ${doctor.first_name} ${doctor.last_name}`);
  console.log(`   UUID: ${doctor.id}\n`);

  // Step 3: Get a hospital
  const { data: hospitals, error: hospitalError } = await supabase
    .from('hospitals')
    .select('id, name')
    .limit(1);

  if (hospitalError || !hospitals || hospitals.length === 0) {
    console.error('❌ No hospitals found');
    return false;
  }

  const hospital = hospitals[0];
  console.log(`✅ Found hospital: ${hospital.name}`);
  console.log(`   UUID: ${hospital.id}\n`);

  // Step 4: Try to create an appointment
  console.log('🔄 Attempting to create appointment...');
  
  const appointmentData = {
    patient_id: patient.id,
    doctor_id: doctor.id,
    hospital_id: hospital.id,
    appointment_date: '2026-01-15',
    appointment_time: '10:00:00',
    status: 'scheduled',
    reason: 'Test appointment',
    notes: 'This is a test'
  };

  console.log('   Data:', JSON.stringify(appointmentData, null, 2));

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (appointmentError) {
    console.error('❌ FAILED to create appointment!');
    console.error('   Error:', appointmentError.message);
    console.error('   Code:', appointmentError.code);
    console.error('   Details:', appointmentError.details);
    console.error('   Hint:', appointmentError.hint);
    console.log('\n🔧 FIX REQUIRED:');
    console.log('   Run this SQL in Supabase Dashboard:');
    console.log('   File: supabase/fix-rls-policies.sql\n');
    return false;
  }

  console.log('✅ Appointment created successfully!');
  console.log('   ID:', appointment.id);
  console.log('   Date:', appointment.appointment_date);
  console.log('   Time:', appointment.appointment_time);
  console.log('   Status:', appointment.status);

  // Step 5: Clean up test appointment
  console.log('\n🧹 Cleaning up test appointment...');
  await supabase
    .from('appointments')
    .delete()
    .eq('id', appointment.id);
  console.log('✅ Test appointment deleted\n');

  return true;
}

testAppointmentCreation().then(success => {
  if (success) {
    console.log('✅ ==========================================');
    console.log('✅ APPOINTMENT CREATION WORKING!');
    console.log('✅ ==========================================\n');
    console.log('📋 You can now book appointments in the app!');
  } else {
    console.log('\n❌ ==========================================');
    console.log('❌ RLS POLICY BLOCKING INSERTS');
    console.log('❌ ==========================================\n');
    console.log('📝 Action Required:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy & Run: supabase/fix-rls-policies.sql');
    console.log('   3. Re-run: node test-appointment-creation.js\n');
  }
  process.exit(success ? 0 : 1);
});
