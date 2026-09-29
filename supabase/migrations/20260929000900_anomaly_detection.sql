-- ============================================================================
-- ANOMALY DETECTION OVER THE AUDIT CHAIN
-- ============================================================================
-- A scheduled scan (pg_cron, every 5 minutes) reads public.audit_log and
-- raises security_alerts for:
--   mass_record_access    one user reading > 50 distinct patients in 10 min
--   off_hours_access      staff reading patient data outside working hours
--   excessive_break_glass > 2 break-glass grants by one doctor in a day
-- (Each break-glass grant and each neutralized prompt injection already
-- raises its own alert at the time it happens.)
--
-- Thresholds live in security_rule_config so they can be tuned without a
-- migration. Alerts carry a dedupe_key, so re-running a scan never
-- duplicates an alert. Admins acknowledge alerts from the dashboard.
-- ============================================================================

create extension if not exists pg_cron;

create table public.security_rule_config (
  rule        text primary key,
  enabled     boolean not null default true,
  threshold   int,
  window_mins int,
  params      jsonb not null default '{}'::jsonb,
  description text not null
);
alter table public.security_rule_config enable row level security;
revoke all on public.security_rule_config from anon, authenticated;
grant select, update (enabled, threshold, window_mins, params) on public.security_rule_config to authenticated;
create policy security_rule_config_admin on public.security_rule_config for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

insert into public.security_rule_config (rule, threshold, window_mins, params, description) values
  ('mass_record_access', 50, 10, '{}',
   'One user reading more than N distinct patients within the window'),
  ('off_hours_access', null, null,
   '{"timezone": "Asia/Kolkata", "start": "07:00", "end": "20:00"}',
   'Clinical/staff reads of patient data outside working hours'),
  ('excessive_break_glass', 2, 1440, '{"timezone": "Asia/Kolkata"}',
   'More than N break-glass grants by one doctor in a day');

-- Actions that count as reading patient data.
create or replace function private.is_read_action(p_action text) returns boolean
language sql immutable set search_path = '' as $$
  select p_action in ('read', 'break_glass_read', 'view_patient_profile', 'ai_query',
                      'view_report', 'download_report', 'export_record')
$$;

create or replace function public.scan_security_anomalies(p_lookback interval default interval '24 hours')
returns table (rule text, alerts_created int)
language plpgsql security definer set search_path = '' as $$
declare
  cfg     public.security_rule_config;
  created int;
  tz      text;
begin
  if not (private.is_admin() or coalesce(auth.role(), '') = 'service_role'
          or session_user in ('postgres', 'supabase_admin')) then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;

  -- 1. Mass record access -----------------------------------------------
  select * into cfg from public.security_rule_config c where c.rule = 'mass_record_access';
  created := 0;
  if cfg.enabled then
    with reads as (
      select a.actor_id, a.actor_role, a.patient_id, a.ts
      from public.audit_log a
      where private.is_read_action(a.action) and a.patient_id is not null
        and a.actor_role <> 'patient' and a.ts > now() - p_lookback
    ),
    windows as (
      select distinct r.actor_id, r.actor_role, date_trunc('minute', r.ts) as w_end from reads r
    ),
    hits as (
      select w.actor_id, w.actor_role,
             min(w.w_end) as first_window,
             max(cnt) as peak
      from windows w
      cross join lateral (
        select count(distinct r.patient_id) as cnt
        from reads r
        where r.actor_id = w.actor_id
          and r.ts >  w.w_end - make_interval(mins => cfg.window_mins)
          and r.ts <= w.w_end + interval '1 minute'
      ) c
      where c.cnt > cfg.threshold
      group by w.actor_id, w.actor_role
    ),
    ins as (
      insert into public.security_alerts (alert_type, severity, title, message, actor_id, metadata, dedupe_key)
      select 'mass_record_access', 'critical',
             'Mass patient record access',
             format('%s %s read %s distinct patient records within %s minutes.',
                    h.actor_role, h.actor_id, h.peak, cfg.window_mins),
             h.actor_id,
             jsonb_build_object('peak_distinct_patients', h.peak, 'window_mins', cfg.window_mins,
                                'first_window', h.first_window),
             format('mass:%s:%s', h.actor_id, to_char(date_trunc('hour', h.first_window), 'YYYYMMDDHH24'))
      from hits h
      on conflict (dedupe_key) where dedupe_key is not null do nothing
      returning 1
    )
    select count(*) into created from ins;
  end if;
  rule := 'mass_record_access'; alerts_created := created; return next;

  -- 2. Off-hours access ---------------------------------------------------
  select * into cfg from public.security_rule_config c where c.rule = 'off_hours_access';
  created := 0;
  if cfg.enabled then
    tz := coalesce(cfg.params ->> 'timezone', 'UTC');
    with off as (
      select a.actor_id, a.actor_role,
             (a.ts at time zone tz)::date as local_day,
             count(*) as n, min(a.ts) as first_ts
      from public.audit_log a
      where private.is_read_action(a.action) and a.patient_id is not null
        and a.actor_role in ('doctor', 'nurse', 'staff', 'admin')
        and a.ts > now() - p_lookback
        and not ((a.ts at time zone tz)::time
                 between (cfg.params ->> 'start')::time and (cfg.params ->> 'end')::time)
      group by 1, 2, 3
    ),
    ins as (
      insert into public.security_alerts (alert_type, severity, title, message, actor_id, metadata, dedupe_key)
      select 'off_hours_access', 'medium',
             'Patient data accessed outside working hours',
             format('%s %s made %s record reads outside %s-%s (%s) on %s.',
                    o.actor_role, o.actor_id, o.n, cfg.params ->> 'start', cfg.params ->> 'end', tz, o.local_day),
             o.actor_id,
             jsonb_build_object('reads', o.n, 'first_at', o.first_ts, 'local_day', o.local_day),
             format('offhours:%s:%s', o.actor_id, o.local_day)
      from off o
      on conflict (dedupe_key) where dedupe_key is not null do nothing
      returning 1
    )
    select count(*) into created from ins;
  end if;
  rule := 'off_hours_access'; alerts_created := created; return next;

  -- 3. Excessive break-glass ----------------------------------------------
  select * into cfg from public.security_rule_config c where c.rule = 'excessive_break_glass';
  created := 0;
  if cfg.enabled then
    tz := coalesce(cfg.params ->> 'timezone', 'UTC');
    with bg as (
      select a.actor_id, (a.ts at time zone tz)::date as local_day, count(*) as n
      from public.audit_log a
      where a.action = 'break_glass_grant' and a.ts > now() - p_lookback
      group by 1, 2
      having count(*) > cfg.threshold
    ),
    ins as (
      insert into public.security_alerts (alert_type, severity, title, message, actor_id, metadata, dedupe_key)
      select 'excessive_break_glass', 'high',
             'Repeated emergency access',
             format('Doctor %s used break-glass %s times on %s (limit %s).', b.actor_id, b.n, b.local_day, cfg.threshold),
             b.actor_id,
             jsonb_build_object('grants', b.n, 'local_day', b.local_day),
             format('bgx:%s:%s', b.actor_id, b.local_day)
      from bg b
      on conflict (dedupe_key) where dedupe_key is not null do nothing
      returning 1
    )
    select count(*) into created from ins;
  end if;
  rule := 'excessive_break_glass'; alerts_created := created; return next;
end $$;

revoke all on function public.scan_security_anomalies from public, anon;
grant execute on function public.scan_security_anomalies to authenticated, service_role;

-- Acknowledge from the dashboard (records who and when).
create or replace function public.acknowledge_security_alert(p_alert_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() or not private.mfa_satisfied() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;
  update public.security_alerts
     set is_dismissed = true, dismissed_by = private.my_profile_id(), dismissed_at = now()
   where id = p_alert_id and not is_dismissed;
  perform private.append_audit('alert_acknowledged', 'security_alerts', p_alert_id::text, null);
end $$;
revoke all on function public.acknowledge_security_alert from public, anon;
grant execute on function public.acknowledge_security_alert to authenticated;

-- Every 5 minutes.
select cron.schedule('scan-security-anomalies', '*/5 * * * *',
                     $$select public.scan_security_anomalies()$$);
