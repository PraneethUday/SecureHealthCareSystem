-- ============================================================================
-- IDENTITY + ROW LEVEL SECURITY
-- ============================================================================
-- Before this migration the database had no idea who was calling it:
--   * login was custom (bcrypt in role tables), the session lived in
--     browser sessionStorage, and every query ran as `anon`
--   * patients/doctors/nurses/staff/admins/access_logs had RLS disabled
--   * every other table had `USING (true)` policies
--   * every public function (incl. admin_unlock_account and
--     apply_retention_policies) was executable by `anon`
--
-- After this migration:
--   * each role-table row is linked to an auth.users row (auth_user_id)
--   * identity is resolved from auth.uid() by helpers in the `private`
--     schema (not exposed through PostgREST)
--   * `anon` has no table access at all; `authenticated` sees only what
--     its care relationship allows
--   * credential columns are not selectable by any client role
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Link role tables to Supabase Auth
-- ----------------------------------------------------------------------------
alter table public.patients add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table public.doctors  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table public.nurses   add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table public.staff    add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table public.admins   add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

-- ----------------------------------------------------------------------------
-- 2. Identity helpers
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so they can read role tables regardless of the caller's
-- RLS; every one of them is keyed on auth.uid(), so a caller can only ever
-- learn about themselves. The private schema is not in PostgREST's
-- exposed schemas, so these are callable from policies but not over HTTP.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.my_patient_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.patients where auth_user_id = (select auth.uid())
$$;

create or replace function private.my_doctor_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.doctors where auth_user_id = (select auth.uid())
$$;

create or replace function private.my_nurse_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.nurses where auth_user_id = (select auth.uid())
$$;

create or replace function private.my_staff_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.staff where auth_user_id = (select auth.uid())
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where auth_user_id = (select auth.uid()))
$$;

create or replace function private.app_role() returns text
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.patients where auth_user_id = (select auth.uid())) then 'patient'
    when exists (select 1 from public.doctors  where auth_user_id = (select auth.uid())) then 'doctor'
    when exists (select 1 from public.nurses   where auth_user_id = (select auth.uid())) then 'nurse'
    when exists (select 1 from public.staff    where auth_user_id = (select auth.uid())) then 'staff'
    when exists (select 1 from public.admins   where auth_user_id = (select auth.uid())) then 'admin'
  end
$$;

-- The id the rest of the app uses to address "me" in text columns
-- (notifications.recipient_id, chat_messages.sender_id, ...).
create or replace function private.my_profile_id() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select id::text from public.patients where auth_user_id = (select auth.uid())),
    (select id::text from public.doctors  where auth_user_id = (select auth.uid())),
    (select id::text from public.nurses   where auth_user_id = (select auth.uid())),
    (select id::text from public.staff    where auth_user_id = (select auth.uid())),
    (select id       from public.admins   where auth_user_id = (select auth.uid()))
  )
$$;

-- ----------------------------------------------------------------------------
-- 3. Care-relationship helpers
-- ----------------------------------------------------------------------------
-- "Assigned" means a non-cancelled appointment links the clinician to the
-- patient. Doctors also keep access to patients they have written records
-- or prescriptions for.
create or replace function private.doctor_treats(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.appointments a
    where a.patient_id = p_patient
      and a.doctor_id = private.my_doctor_id()
      and a.status is distinct from 'cancelled'
  ) or exists (
    select 1 from public.medical_records m
    where m.patient_id = p_patient and m.doctor_id = private.my_doctor_id()
  )
$$;

create or replace function private.nurse_assigned(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.appointments a
    where a.patient_id = p_patient
      and a.nurse_id = private.my_nurse_id()
      and a.status is distinct from 'cancelled'
  )
$$;

-- Front-desk / pharmacy staff serve patients who have an appointment at a
-- hospital they work at. They get demographics and prescriptions, never
-- clinical notes.
create or replace function private.staff_serves(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.appointments a
    join public.staff_hospitals sh on sh.hospital_id = a.hospital_id
    where a.patient_id = p_patient and sh.staff_id = private.my_staff_id()
  )
$$;

-- Clinical data: the patient themself, their treating doctor, their
-- assigned nurse. (Break-glass is added to this in a later migration.)
create or replace function private.can_view_clinical(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_patient = private.my_patient_id()
      or private.doctor_treats(p_patient)
      or private.nurse_assigned(p_patient)
$$;

create or replace function private.is_care_team(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.doctor_treats(p_patient) or private.nurse_assigned(p_patient)
$$;

-- Directory-level data (name, contact, appointments).
create or replace function private.can_view_patient(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.can_view_clinical(p_patient)
      or private.staff_serves(p_patient)
      or private.is_admin()
$$;

grant execute on all functions in schema private to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Lock down: no anon access, drop every legacy permissive policy
-- ----------------------------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon, public;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon, public;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- Privileged functions: service role only (server code checks the caller).
revoke execute on function public.admin_lock_account, public.admin_unlock_account,
  public.apply_retention_policies, public.cleanup_old_security_data,
  public.detect_unusual_access_patterns, public.get_recent_failed_attempts,
  public.increment_login_attempts, public.is_account_locked,
  public.lock_account_after_failed_attempts, public.record_login_attempt,
  public.reset_login_attempts, public.auto_expire_notifications
  from authenticated;
grant execute on function public.get_unread_message_count to authenticated;

-- Trigger functions write to tables the caller can't (logs, alerts, nurse
-- auto-assignment reads every nurse). Run them as owner with a pinned path.
alter function public.auto_assign_nurse_to_appointment() security definer set search_path = public, pg_temp;
alter function public.check_vital_thresholds()           security definer set search_path = public, pg_temp;
alter function public.log_appointment_change()           security definer set search_path = public, pg_temp;
alter function public.log_medical_report_action()        security definer set search_path = public, pg_temp;
alter function public.update_conversation_on_message()   security definer set search_path = public, pg_temp;
alter function public.cleanup_old_signaling_data()       security definer set search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 5. Role tables: hide credential columns, then row policies
-- ----------------------------------------------------------------------------
revoke select, insert, update, delete on public.patients, public.doctors, public.nurses, public.staff, public.admins from authenticated;

grant select (id, patient_id, first_name, last_name, email, phone, phone_number, date_of_birth,
  gender, address, city, state, zip_code, emergency_contact, blood_group, allergies,
  medical_history, current_medications, health_profile, is_profile_completed,
  is_mfa_enabled, last_login, created_at, updated_at, auth_user_id)
  on public.patients to authenticated;
grant update (first_name, last_name, phone, phone_number, date_of_birth, gender, address,
  city, state, zip_code, emergency_contact, blood_group, allergies, medical_history,
  current_medications, health_profile, is_profile_completed, updated_at)
  on public.patients to authenticated;

grant select (id, doctor_id, first_name, last_name, email, phone, specialization,
  license_number, department, years_of_experience, created_at, updated_at, auth_user_id)
  on public.doctors to authenticated;
grant select (id, nurse_id, first_name, last_name, email, phone, license_number,
  department, shift, created_at, updated_at, auth_user_id)
  on public.nurses to authenticated;
grant select (id, staff_id, first_name, last_name, email, phone, role, department,
  created_at, updated_at, auth_user_id)
  on public.staff to authenticated;
grant select (id, full_name, email, created_at, updated_at, auth_user_id)
  on public.admins to authenticated;

create policy patients_select on public.patients for select to authenticated
  using (private.can_view_patient(id));
create policy patients_update_self on public.patients for update to authenticated
  using (id = (select private.my_patient_id()))
  with check (id = (select private.my_patient_id()));

-- Clinician/staff directory is needed for booking and assignment screens.
create policy doctors_select on public.doctors for select to authenticated using (true);
create policy nurses_select  on public.nurses  for select to authenticated using (true);
create policy staff_select   on public.staff   for select to authenticated using (true);
create policy admins_select  on public.admins  for select to authenticated
  using (auth_user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- 6. Reference data
-- ----------------------------------------------------------------------------
create policy hospitals_select        on public.hospitals        for select to authenticated using (true);
create policy doctor_hospitals_select on public.doctor_hospitals for select to authenticated using (true);
create policy nurse_hospitals_select  on public.nurse_hospitals  for select to authenticated using (true);
create policy staff_hospitals_select  on public.staff_hospitals  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 7. Appointments
-- ----------------------------------------------------------------------------
create policy appointments_select on public.appointments for select to authenticated
  using (
    patient_id = (select private.my_patient_id())
    or doctor_id = (select private.my_doctor_id())
    or nurse_id  = (select private.my_nurse_id())
    or hospital_id in (select sh.hospital_id from public.staff_hospitals sh where sh.staff_id = (select private.my_staff_id()))
    or (select private.is_admin())
  );
create policy appointments_insert on public.appointments for insert to authenticated
  with check (
    patient_id = (select private.my_patient_id())
    or hospital_id in (select sh.hospital_id from public.staff_hospitals sh where sh.staff_id = (select private.my_staff_id()))
  );
create policy appointments_update on public.appointments for update to authenticated
  using (
    patient_id = (select private.my_patient_id())
    or doctor_id = (select private.my_doctor_id())
    or nurse_id  = (select private.my_nurse_id())
    or hospital_id in (select sh.hospital_id from public.staff_hospitals sh where sh.staff_id = (select private.my_staff_id()))
  );

create policy appointment_logs_select on public.appointment_logs for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.appointments a where a.id = appointment_id));
create policy appointment_logs_insert on public.appointment_logs for insert to authenticated
  with check (exists (select 1 from public.appointments a where a.id = appointment_id)
              and performed_by_user_id = (select private.my_profile_id()));

-- ----------------------------------------------------------------------------
-- 8. Clinical data
-- ----------------------------------------------------------------------------
create policy medical_records_select on public.medical_records for select to authenticated
  using (private.can_view_clinical(patient_id));
create policy medical_records_insert on public.medical_records for insert to authenticated
  with check (doctor_id = (select private.my_doctor_id()) and private.doctor_treats(patient_id));
create policy medical_records_update on public.medical_records for update to authenticated
  using (doctor_id = (select private.my_doctor_id()))
  with check (doctor_id = (select private.my_doctor_id()));

create policy medical_record_logs_select on public.medical_record_logs for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.medical_records m where m.id = medical_record_id));
create policy medical_record_logs_insert on public.medical_record_logs for insert to authenticated
  with check (exists (select 1 from public.medical_records m where m.id = medical_record_id)
              and performed_by_user_id = (select private.my_profile_id()));

create policy prescriptions_select on public.prescriptions for select to authenticated
  using (private.can_view_clinical(patient_id) or private.staff_serves(patient_id));
create policy prescriptions_insert on public.prescriptions for insert to authenticated
  with check (doctor_id = (select private.my_doctor_id()) and private.doctor_treats(patient_id));
create policy prescriptions_update on public.prescriptions for update to authenticated
  using (doctor_id = (select private.my_doctor_id()) or private.staff_serves(patient_id));

create policy prescription_logs_select on public.prescription_logs for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.prescriptions p where p.id = prescription_id));
create policy prescription_logs_insert on public.prescription_logs for insert to authenticated
  with check (exists (select 1 from public.prescriptions p where p.id = prescription_id)
              and performed_by_user_id = (select private.my_profile_id()));

create policy patient_vitals_select on public.patient_vitals for select to authenticated
  using (private.can_view_clinical(patient_id));
create policy patient_vitals_insert on public.patient_vitals for insert to authenticated
  with check (private.can_view_clinical(patient_id));

create policy vitals_alerts_select on public.vitals_alerts for select to authenticated
  using (private.can_view_clinical(patient_id));
create policy vitals_alerts_update on public.vitals_alerts for update to authenticated
  using (private.is_care_team(patient_id));

create policy medical_reports_select on public.medical_reports for select to authenticated
  using (private.can_view_clinical(patient_id));
create policy medical_reports_insert on public.medical_reports for insert to authenticated
  with check (private.can_view_clinical(patient_id)
              and uploaded_by_user_id = (select private.my_profile_id()));

create policy medical_report_logs_select on public.medical_report_logs for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.medical_reports r where r.id = report_id));
create policy medical_report_logs_insert on public.medical_report_logs for insert to authenticated
  with check (exists (select 1 from public.medical_reports r where r.id = report_id)
              and performed_by_user_id = (select private.my_profile_id()));

-- ----------------------------------------------------------------------------
-- 9. Communication
-- ----------------------------------------------------------------------------
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = (select private.my_profile_id()));
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = (select private.my_profile_id()));
-- Any signed-in user may notify another (appointment booked, access granted).
create policy notifications_insert on public.notifications for insert to authenticated
  with check ((select auth.uid()) is not null);

create policy chat_conversations_select on public.chat_conversations for select to authenticated
  using (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));
create policy chat_conversations_insert on public.chat_conversations for insert to authenticated
  with check (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));

create policy chat_messages_select on public.chat_messages for select to authenticated
  using (exists (select 1 from public.chat_conversations c where c.id = conversation_id));
create policy chat_messages_insert on public.chat_messages for insert to authenticated
  with check (exists (select 1 from public.chat_conversations c where c.id = conversation_id)
              and sender_id = (select private.my_profile_id()));
create policy chat_messages_update on public.chat_messages for update to authenticated
  using (exists (select 1 from public.chat_conversations c where c.id = conversation_id));

create policy chat_attachments_select on public.chat_attachments for select to authenticated
  using (exists (select 1 from public.chat_messages m where m.id = message_id));
create policy chat_attachments_insert on public.chat_attachments for insert to authenticated
  with check (exists (select 1 from public.chat_messages m where m.id = message_id
                      and m.sender_id = (select private.my_profile_id())));

create policy video_calls_select on public.video_calls for select to authenticated
  using (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));
create policy video_calls_insert on public.video_calls for insert to authenticated
  with check (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));
create policy video_calls_update on public.video_calls for update to authenticated
  using (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));

create policy video_call_signaling_select on public.video_call_signaling for select to authenticated
  using (exists (select 1 from public.video_calls v where v.id = video_call_id));
create policy video_call_signaling_insert on public.video_call_signaling for insert to authenticated
  with check (exists (select 1 from public.video_calls v where v.id = video_call_id)
              and from_user_id = (select private.my_profile_id()));

create policy video_call_logs_select on public.video_call_logs for select to authenticated
  using (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));
create policy video_call_logs_insert on public.video_call_logs for insert to authenticated
  with check (patient_id = (select private.my_patient_id()) or doctor_id = (select private.my_doctor_id()));

-- ----------------------------------------------------------------------------
-- 10. Security & audit tables: admins read, server (service role) writes
-- ----------------------------------------------------------------------------
-- login_attempts, account_locks, otp_logs, password_history, login_audit:
-- no client policies at all -> only the service role can touch them.
create policy access_logs_admin_select on public.access_logs for select to authenticated
  using ((select private.is_admin()));
create policy login_attempts_admin_select on public.login_attempts for select to authenticated
  using ((select private.is_admin()));
create policy security_alerts_admin on public.security_alerts for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy security_incidents_admin on public.security_incidents for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy audit_retention_policies_admin on public.audit_retention_policies for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
