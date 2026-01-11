-- prescriptions table
create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  doctor_id uuid not null,
  patient_id uuid not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- prescription_items table
create table prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid references prescriptions(id) on delete cascade,
  medicine_name text not null,
  dosage text,
  frequency text,
  duration text,
  instructions text
);

-- Enable RLS
alter table prescriptions enable row level security;
alter table prescription_items enable row level security;

-- Prescriptions RLS
create policy "Doctors can insert for their own appointments"
on prescriptions for insert
using (
  auth.role = 'doctor'
  and doctor_id = auth.uid()
);

create policy "Doctors can read their own prescriptions"
on prescriptions for select
using (
  auth.role = 'doctor'
  and doctor_id = auth.uid()
);

create policy "Staff can read all prescriptions"
on prescriptions for select
using (
  auth.role = 'staff'
);

create policy "Patients can read their own prescriptions"
on prescriptions for select
using (
  auth.role = 'patient'
  and patient_id = auth.uid()
);

-- Prescription Items RLS
create policy "Doctors can insert items for their prescriptions"
on prescription_items for insert
using (
  auth.role = 'doctor'
  and prescription_id in (select id from prescriptions where doctor_id = auth.uid())
);

create policy "Doctors can read items for their prescriptions"
on prescription_items for select
using (
  auth.role = 'doctor'
  and prescription_id in (select id from prescriptions where doctor_id = auth.uid())
);

create policy "Staff can read all prescription items"
on prescription_items for select
using (
  auth.role = 'staff'
);

create policy "Patients can read their own prescription items"
on prescription_items for select
using (
  auth.role = 'patient'
  and prescription_id in (select id from prescriptions where patient_id = auth.uid())
);