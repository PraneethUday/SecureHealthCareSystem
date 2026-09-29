-- ============================================================================
-- BREAK-GLASS EMERGENCY ACCESS
-- ============================================================================
-- A doctor may open an unassigned patient's clinical record in an emergency
-- by stating a reason. The grant is time-boxed (60 minutes), every use is
-- written to the audit chain as break_glass_*, and every grant raises a
-- security alert for admin review.
-- ============================================================================

create table public.break_glass_grants (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references public.doctors (id) on delete cascade,
  patient_id  uuid not null references public.patients (id) on delete cascade,
  reason      text not null check (char_length(btrim(reason)) >= 20),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '60 minutes',
  revoked_at  timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text,
  check (expires_at > created_at)
);

create index break_glass_active_idx on public.break_glass_grants (doctor_id, patient_id, expires_at);
create index break_glass_unreviewed_idx on public.break_glass_grants (created_at desc) where reviewed_at is null;

alter table public.break_glass_grants enable row level security;
revoke all on public.break_glass_grants from anon, authenticated;
grant select on public.break_glass_grants to authenticated;

create policy break_glass_select on public.break_glass_grants for select to authenticated
  using (doctor_id = (select private.my_doctor_id()) or (select private.is_admin()));
create policy break_glass_require_aal2 on public.break_glass_grants as restrictive for all to authenticated
  using ((select private.mfa_satisfied()));

-- ----------------------------------------------------------------------------
-- Access helpers
-- ----------------------------------------------------------------------------
create or replace function private.has_break_glass(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.break_glass_grants g
    where g.patient_id = p_patient
      and g.doctor_id = private.my_doctor_id()
      and g.revoked_at is null
      and g.expires_at > now()
  )
$$;

-- True when break-glass is the *only* reason the caller can see the patient.
create or replace function private.via_break_glass(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_break_glass(p_patient)
     and not private.doctor_treats(p_patient)
     and not private.nurse_assigned(p_patient)
$$;

-- Clinical access now also allows an active, unexpired break-glass grant.
create or replace function private.can_view_clinical(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_patient = private.my_patient_id()
      or private.doctor_treats(p_patient)
      or private.nurse_assigned(p_patient)
      or private.has_break_glass(p_patient)
$$;

grant execute on function private.has_break_glass(uuid), private.via_break_glass(uuid)
  to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Security alerts: allow the new alert kinds used by break-glass and the
-- anomaly detector, plus a dedupe key so scheduled scans are idempotent.
-- ----------------------------------------------------------------------------
alter table public.security_alerts drop constraint security_alerts_alert_type_check;
alter table public.security_alerts add constraint security_alerts_alert_type_check
  check (alert_type = any (array[
    'anomaly_detected', 'incident_created', 'threshold_exceeded', 'breach_suspected',
    'policy_violation', 'retention_executed', 'system_warning',
    'break_glass', 'mass_record_access', 'off_hours_access', 'excessive_break_glass',
    'prompt_injection'
  ]));
alter table public.security_alerts add column if not exists actor_id text;
alter table public.security_alerts add column if not exists dedupe_key text;
create unique index if not exists security_alerts_dedupe_idx
  on public.security_alerts (dedupe_key) where dedupe_key is not null;

-- ----------------------------------------------------------------------------
-- Requesting access
-- ----------------------------------------------------------------------------
create or replace function public.request_break_glass(p_patient_code text, p_reason text)
returns table (grant_id uuid, patient_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_doctor  uuid := private.my_doctor_id();
  v_patient uuid;
  v_grant   public.break_glass_grants;
begin
  if v_doctor is null then
    raise exception 'only doctors can use emergency access' using errcode = 'insufficient_privilege';
  end if;
  if not private.mfa_satisfied() then
    raise exception 'multi-factor authentication required' using errcode = 'insufficient_privilege';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 20 then
    raise exception 'a reason of at least 20 characters is required' using errcode = 'check_violation';
  end if;

  select p.id into v_patient from public.patients p where p.patient_id = p_patient_code;
  if v_patient is null then
    raise exception 'patient not found' using errcode = 'no_data_found';
  end if;

  insert into public.break_glass_grants (doctor_id, patient_id, reason)
  values (v_doctor, v_patient, btrim(p_reason))
  returning * into v_grant;

  -- The reason can contain clinical detail, so it stays in the grants table
  -- (admin-readable) and is not copied into the audit chain.
  perform private.append_audit('break_glass_grant', 'break_glass_grants', v_grant.id::text,
                               v_patient, jsonb_build_object('expires_at', v_grant.expires_at));

  insert into public.security_alerts (alert_type, severity, title, message, actor_id, metadata, dedupe_key)
  select 'break_glass', 'high',
         'Emergency access used',
         format('Dr. %s %s opened patient %s under break-glass. Review required.',
                d.first_name, d.last_name, p_patient_code),
         v_doctor::text,
         jsonb_build_object('grant_id', v_grant.id, 'patient_id', v_patient,
                            'expires_at', v_grant.expires_at),
         'break_glass:' || v_grant.id
  from public.doctors d where d.id = v_doctor;

  return query select v_grant.id, v_grant.patient_id, v_grant.expires_at;
end $$;
revoke all on function public.request_break_glass from public, anon;
grant execute on function public.request_break_glass to authenticated;

create or replace function public.review_break_glass(p_grant_id uuid, p_note text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() or not private.mfa_satisfied() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;
  update public.break_glass_grants
     set reviewed_at = now(), reviewed_by = private.my_profile_id(), review_note = p_note,
         revoked_at = coalesce(revoked_at, least(now(), expires_at))
   where id = p_grant_id;
  perform private.append_audit('break_glass_reviewed', 'break_glass_grants', p_grant_id::text,
                               (select g.patient_id from public.break_glass_grants g where g.id = p_grant_id));
end $$;
revoke all on function public.review_break_glass from public, anon;
grant execute on function public.review_break_glass to authenticated;

-- ----------------------------------------------------------------------------
-- Audited reads: tag break-glass reads distinctly
-- ----------------------------------------------------------------------------
create or replace function private.read_action(p_patient uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case when private.via_break_glass(p_patient) then 'break_glass_read' else 'read' end
$$;
grant execute on function private.read_action(uuid) to authenticated;

create or replace function public.read_medical_records(p_patient_id uuid default null)
returns setof public.medical_records
language plpgsql security invoker set search_path = '' as $$
declare r record;
begin
  for r in
    select m.patient_id, array_agg(m.id::text) ids
    from public.medical_records m
    where p_patient_id is null or m.patient_id = p_patient_id
    group by m.patient_id
  loop
    perform private.append_audit(private.read_action(r.patient_id), 'medical_records',
                                 array_to_string(r.ids, ','), r.patient_id);
  end loop;
  return query
    select * from public.medical_records m
    where p_patient_id is null or m.patient_id = p_patient_id
    order by m.record_date desc, m.created_at desc;
end $$;

create or replace function public.read_prescriptions(p_patient_id uuid default null)
returns setof public.prescriptions
language plpgsql security invoker set search_path = '' as $$
declare r record;
begin
  for r in
    select p.patient_id, array_agg(p.id::text) ids
    from public.prescriptions p
    where p_patient_id is null or p.patient_id = p_patient_id
    group by p.patient_id
  loop
    perform private.append_audit(private.read_action(r.patient_id), 'prescriptions',
                                 array_to_string(r.ids, ','), r.patient_id);
  end loop;
  return query
    select * from public.prescriptions p
    where p_patient_id is null or p.patient_id = p_patient_id
    order by p.prescribed_date desc, p.created_at desc;
end $$;

create or replace function public.read_vitals(p_patient_id uuid)
returns setof public.patient_vitals
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.patient_vitals v where v.patient_id = p_patient_id) then
    perform private.append_audit(private.read_action(p_patient_id), 'patient_vitals', null, p_patient_id);
  end if;
  return query
    select * from public.patient_vitals v
    where v.patient_id = p_patient_id
    order by v.recorded_at desc;
end $$;
