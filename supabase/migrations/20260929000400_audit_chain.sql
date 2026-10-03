-- ============================================================================
-- HASH-CHAINED, APPEND-ONLY AUDIT LOG
-- ============================================================================
-- Every row stores sha256(prev_hash | actor | action | target | ts). Editing
-- or deleting any historical row breaks every hash after it, and
-- verify_audit_chain() reports the first broken link.
--
-- Ordering: the chain is defined over `seq`, assigned inside the insert
-- trigger while holding a transaction-scoped advisory lock. Using `id` would
-- fork the chain under concurrency (ids are handed out before commit order
-- is known).
--
-- Postgres has no SELECT triggers, so reads of patient data are audited by
-- routing them through the read_* RPCs below, which append a row per call.
-- ============================================================================

create table public.audit_log (
  id           bigint generated always as identity primary key,
  seq          bigint not null unique,
  actor_id     text not null,
  actor_role   text not null,
  action       text not null,
  target_table text,
  target_id    text,
  patient_id   uuid references public.patients (id) on delete set null,
  ip           text,
  details      jsonb not null default '{}'::jsonb,
  ts           timestamptz not null default now(),
  prev_hash    text not null,
  hash         text not null
);

create index audit_log_patient_ts_idx on public.audit_log (patient_id, ts desc);
create index audit_log_actor_ts_idx   on public.audit_log (actor_id, ts desc);
create index audit_log_action_ts_idx  on public.audit_log (action, ts desc);

comment on table public.audit_log is
  'Tamper-evident audit trail. Append-only: UPDATE/DELETE/TRUNCATE are revoked and blocked by trigger. Never store restricted (PHI) field values in details.';

-- ----------------------------------------------------------------------------
-- Hashing
-- ----------------------------------------------------------------------------
create or replace function private.audit_row_hash(
  p_prev_hash text, p_seq bigint, p_actor_id text, p_actor_role text,
  p_action text, p_target_table text, p_target_id text, p_patient_id uuid,
  p_ts timestamptz
) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(
    concat_ws('|',
      p_prev_hash, p_seq::text, p_actor_id, p_actor_role, p_action,
      coalesce(p_target_table, ''), coalesce(p_target_id, ''),
      coalesce(p_patient_id::text, ''),
      to_char(p_ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    ), 'sha256'), 'hex')
$$;

create or replace function private.audit_log_chain() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  last_seq  bigint;
  last_hash text;
begin
  -- Serialize appenders; the lock is released at commit.
  perform pg_advisory_xact_lock(hashtext('public.audit_log.chain'));

  select a.seq, a.hash into last_seq, last_hash
  from public.audit_log a order by a.seq desc limit 1;

  new.seq       := coalesce(last_seq, 0) + 1;
  new.ts        := now();
  new.prev_hash := coalesce(last_hash, repeat('0', 64));
  new.hash      := private.audit_row_hash(new.prev_hash, new.seq, new.actor_id,
                     new.actor_role, new.action, new.target_table, new.target_id,
                     new.patient_id, new.ts);
  return new;
end $$;

create trigger audit_log_chain before insert on public.audit_log
  for each row execute function private.audit_log_chain();

-- ----------------------------------------------------------------------------
-- Append-only
-- ----------------------------------------------------------------------------
create or replace function private.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append-only (% blocked)', tg_op
    using errcode = 'insufficient_privilege';
end $$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function private.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_log_immutable();

revoke all on public.audit_log from anon, authenticated, service_role;
grant select on public.audit_log to authenticated, service_role;
-- Inserts only through the append functions below.

alter table public.audit_log enable row level security;
create policy audit_log_admin_select on public.audit_log for select to authenticated
  using ((select private.is_admin()));
create policy audit_log_require_aal2 on public.audit_log as restrictive for all to authenticated
  using ((select private.mfa_satisfied()));

-- ----------------------------------------------------------------------------
-- Appending
-- ----------------------------------------------------------------------------
-- As the signed-in user: the actor is derived from auth.uid(), so callers
-- cannot write entries in someone else's name.
create or replace function private.append_audit(
  p_action text, p_target_table text, p_target_id text,
  p_patient_id uuid, p_details jsonb default '{}'::jsonb
) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, actor_role, action, target_table,
                                target_id, patient_id, ip, details, seq, prev_hash, hash)
  values (
    coalesce(private.my_profile_id(), (select auth.uid())::text, 'anonymous'),
    coalesce(private.app_role(), 'unknown'),
    p_action, p_target_table, p_target_id, p_patient_id,
    nullif(split_part(coalesce(
      current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1), ''),
    coalesce(p_details, '{}'::jsonb),
    0, '', ''  -- replaced by the chain trigger
  )
$$;

-- For trusted server code (service role) logging events with no user
-- session, e.g. failed logins.
create or replace function public.append_audit_as(
  p_actor_id text, p_actor_role text, p_action text,
  p_target_table text default null, p_target_id text default null,
  p_patient_id uuid default null, p_ip text default null,
  p_details jsonb default '{}'::jsonb
) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, actor_role, action, target_table,
                                target_id, patient_id, ip, details, seq, prev_hash, hash)
  values (p_actor_id, p_actor_role, p_action, p_target_table, p_target_id,
          p_patient_id, p_ip, coalesce(p_details, '{}'::jsonb), 0, '', '')
$$;
revoke all on function public.append_audit_as from public, anon, authenticated;
grant execute on function public.append_audit_as to service_role;

-- Client-callable wrapper for app-level events (e.g. "viewed report").
-- Only a fixed set of actions is accepted from clients.
create or replace function public.log_event(
  p_action text, p_target_table text default null, p_target_id text default null,
  p_patient_id uuid default null
) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_action not in ('view_report', 'download_report', 'view_patient_profile', 'export_record') then
    raise exception 'unsupported audit action %', p_action;
  end if;
  if p_patient_id is not null and not private.can_view_patient(p_patient_id) then
    raise exception 'not permitted' using errcode = 'insufficient_privilege';
  end if;
  perform private.append_audit(p_action, p_target_table, p_target_id, p_patient_id);
end $$;
revoke all on function public.log_event from public, anon;
grant execute on function public.log_event to authenticated;

-- ----------------------------------------------------------------------------
-- Audited reads
-- ----------------------------------------------------------------------------
-- SECURITY INVOKER: the SELECTs run under the caller's RLS, so these return
-- exactly what the caller could read anyway, plus leave a trail. One audit
-- row per patient whose data was returned.
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
    perform private.append_audit('read', 'medical_records', array_to_string(r.ids, ','), r.patient_id);
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
    perform private.append_audit('read', 'prescriptions', array_to_string(r.ids, ','), r.patient_id);
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
    perform private.append_audit('read', 'patient_vitals', null, p_patient_id);
  end if;
  return query
    select * from public.patient_vitals v
    where v.patient_id = p_patient_id
    order by v.recorded_at desc;
end $$;

revoke all on function public.read_medical_records, public.read_prescriptions,
  public.read_vitals from public, anon;
grant execute on function public.read_medical_records, public.read_prescriptions,
  public.read_vitals to authenticated;

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
create or replace function public.verify_audit_chain()
returns table (ok boolean, rows_checked bigint, first_broken_seq bigint,
               first_broken_id bigint, reason text)
language plpgsql security definer set search_path = '' as $$
declare
  r         record;
  expected  text := repeat('0', 64);
  n         bigint := 0;
  want_seq  bigint := 1;
begin
  if not (private.is_admin() or coalesce(auth.role(), '') = 'service_role'
          or session_user = 'postgres') then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;

  for r in select * from public.audit_log order by seq loop
    n := n + 1;
    if r.seq <> want_seq then
      return query select false, n, r.seq, r.id, format('gap: expected seq %s', want_seq);
      return;
    end if;
    if r.prev_hash <> expected then
      return query select false, n, r.seq, r.id, 'prev_hash does not match previous row';
      return;
    end if;
    if r.hash <> private.audit_row_hash(r.prev_hash, r.seq, r.actor_id, r.actor_role,
                   r.action, r.target_table, r.target_id, r.patient_id, r.ts) then
      return query select false, n, r.seq, r.id, 'row contents do not match its hash';
      return;
    end if;
    expected := r.hash;
    want_seq := want_seq + 1;
  end loop;

  return query select true, n, null::bigint, null::bigint, null::text;
end $$;
revoke all on function public.verify_audit_chain from public, anon;
grant execute on function public.verify_audit_chain to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Patient view: who accessed my record
-- ----------------------------------------------------------------------------
create or replace function public.my_record_access_log(p_limit int default 200)
returns table (ts timestamptz, actor_name text, actor_role text, action text,
               target_table text, break_glass boolean)
language sql stable security definer set search_path = '' as $$
  select a.ts,
         coalesce(
           (select 'Dr. ' || d.first_name || ' ' || d.last_name from public.doctors d where d.id::text = a.actor_id),
           (select n.first_name || ' ' || n.last_name from public.nurses n where n.id::text = a.actor_id),
           (select s.first_name || ' ' || s.last_name from public.staff s where s.id::text = a.actor_id),
           case when a.actor_id = private.my_patient_id()::text then 'You' end,
           'Hospital system'),
         a.actor_role, a.action, a.target_table,
         a.action like 'break_glass%'
  from public.audit_log a
  where a.patient_id = private.my_patient_id()
  order by a.ts desc
  limit least(p_limit, 1000)
$$;
revoke all on function public.my_record_access_log from public, anon;
grant execute on function public.my_record_access_log to authenticated;
