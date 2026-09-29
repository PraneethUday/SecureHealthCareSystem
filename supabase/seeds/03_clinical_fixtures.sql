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

insert into public.medical_records (id, appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, symptoms, treatment_plan, notes)
select 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', p.id, d.id,
  'Chest pain on exertion', 'Stable angina pectoris',
  'Retrosternal tightness climbing stairs, relieved by rest',
  'Start aspirin and a beta blocker; stress ECG in 2 weeks',
  'Patient reports family history of CAD. Contact on 9876543101 for ECG slot.'
from public.patients p, public.doctors d where p.patient_id = 'P001' and d.doctor_id = 'D001'
on conflict (id) do nothing;

insert into public.medical_records (id, appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, symptoms, treatment_plan, notes)
select 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', p.id, d.id,
  'Knee pain after fall', 'Grade II medial collateral ligament sprain',
  'Swelling and medial joint-line tenderness, stable to varus stress',
  'Hinged knee brace, physiotherapy 3x weekly, review in 3 weeks',
  'Allergic to penicillin - avoid in any post-op antibiotic plan.'
from public.patients p, public.doctors d where p.patient_id = 'P002' and d.doctor_id = 'D004'
on conflict (id) do nothing;

insert into public.prescriptions (id, appointment_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
select 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', p.id, d.id,
  'Aspirin', '75 mg', 'Once daily', '90 days', 'Take after breakfast'
from public.patients p, public.doctors d where p.patient_id = 'P001' and d.doctor_id = 'D001'
on conflict (id) do nothing;

insert into public.prescriptions (id, appointment_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
select 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', p.id, d.id,
  'Metoprolol', '25 mg', 'Twice daily', '90 days', 'Hold if pulse below 55'
from public.patients p, public.doctors d where p.patient_id = 'P001' and d.doctor_id = 'D001'
on conflict (id) do nothing;

insert into public.prescriptions (id, appointment_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
select 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', p.id, d.id,
  'Ibuprofen', '400 mg', 'Three times daily', '7 days', 'Take with food'
from public.patients p, public.doctors d where p.patient_id = 'P002' and d.doctor_id = 'D004'
on conflict (id) do nothing;

-- P003 only has self-recorded vitals; nobody on staff is assigned to them.
insert into public.patient_vitals (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, recorded_by)
select id, 72, 128, 84, 'nurse' from public.patients where patient_id = 'P001';
insert into public.patient_vitals (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, recorded_by)
select id, 80, 118, 76, 'nurse' from public.patients where patient_id = 'P002';
insert into public.patient_vitals (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, recorded_by)
select id, 95, 150, 95, 'patient' from public.patients where patient_id = 'P003';
