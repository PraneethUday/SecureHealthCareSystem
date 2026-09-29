-- ============================================================================
-- TOTP MFA ENFORCED IN THE DATABASE
-- ============================================================================
-- Doctors, nurses, staff and admins must hold an aal2 session (password +
-- TOTP) to read or write clinical data. Patients may opt in; once they have
-- a verified factor, their sessions must be aal2 as well.
--
-- These are RESTRICTIVE policies: they are ANDed with the permissive
-- policies from the RLS migration, so a password-only session gets zero
-- rows from the API even if the frontend is bypassed entirely.
-- ============================================================================

create or replace function private.mfa_satisfied() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      or (
        private.app_role() = 'patient'
        and not exists (
          select 1 from auth.mfa_factors f
          where f.user_id = (select auth.uid()) and f.status = 'verified'
        )
      )
$$;
grant execute on function private.mfa_satisfied() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'patients', 'medical_records', 'medical_record_logs',
    'prescriptions', 'prescription_logs',
    'patient_vitals', 'vitals_alerts',
    'medical_reports', 'medical_report_logs',
    'chat_messages', 'chat_attachments',
    'access_logs', 'security_alerts', 'security_incidents'
  ] loop
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated
         using ((select private.mfa_satisfied()))
         with check ((select private.mfa_satisfied()))',
      t || '_require_aal2', t);
  end loop;
end $$;
