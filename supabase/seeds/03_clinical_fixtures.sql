-- ============================================================================
-- Clinical fixtures for local development and access-control tests
-- ============================================================================
-- Care relationships (the access-control tests depend on these):
--   P001 <- D001 (doctor) + N001 (nurse)  at Apollo Hospitals   (staff S001)
--   P002 <- D004 (doctor) + N004 (nurse)  at Fortis Malar
--   P003    no care team at all (break-glass scenario)
-- ============================================================================

insert into public.appointments (id, patient_id, doctor_id, hospital_id, appointment_date, appointment_time, status, reason)
select 'a0000000-0000-0000-0000-000000000001', p.id, d.id, h.id, current_date - 7, '10:00', 'completed', 'Chest pain on exertion'
from public.patients p, public.doctors d, public.hospitals h
where p.patient_id = 'P001' and d.doctor_id = 'D001' and h.name = 'Apollo Hospitals'
on conflict (id) do nothing;

insert into public.appointments (id, patient_id, doctor_id, hospital_id, appointment_date, appointment_time, status, reason)
select 'a0000000-0000-0000-0000-000000000002', p.id, d.id, h.id, current_date - 3, '11:30', 'completed', 'Knee pain after fall'
from public.patients p, public.doctors d, public.hospitals h
where p.patient_id = 'P002' and d.doctor_id = 'D004' and h.name = 'Fortis Malar Hospital'
on conflict (id) do nothing;

-- The auto-assign trigger picks a random nurse; pin the ones the tests expect.
update public.appointments set nurse_id = (select id from public.nurses where nurse_id = 'N001')
where id = 'a0000000-0000-0000-0000-000000000001';
update public.appointments set nurse_id = (select id from public.nurses where nurse_id = 'N004')
where id = 'a0000000-0000-0000-0000-000000000002';

-- medical_records and prescriptions are encrypted at the application layer,
-- so they are created by scripts/seed-clinical.ts (npm run db:reset).

-- P003 only has self-recorded vitals; nobody on staff is assigned to them.
insert into public.patient_vitals (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, recorded_by)
select id, 72, 128, 84, 'nurse' from public.patients where patient_id = 'P001';
insert into public.patient_vitals (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, recorded_by)
select id, 80, 118, 76, 'nurse' from public.patients where patient_id = 'P002';
insert into public.patient_vitals (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, recorded_by)
select id, 95, 150, 95, 'patient' from public.patients where patient_id = 'P003';

-- Seeded dev accounts count as freshly set passwords, so a new local
-- database doesn't force every demo user through a password change.
update public.patients set password_changed_at = now() where password_changed_at is null;
update public.doctors  set password_changed_at = now() where password_changed_at is null;
update public.nurses   set password_changed_at = now() where password_changed_at is null;
update public.staff    set password_changed_at = now() where password_changed_at is null;
