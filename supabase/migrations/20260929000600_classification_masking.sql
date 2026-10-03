-- ============================================================================
-- DATA CLASSIFICATION + ROLE-BASED MASKING
-- ============================================================================
-- Every sensitive column is labelled public / internal / confidential /
-- restricted in public.data_classification. Masking is driven by that
-- table, not hard-coded per screen:
--
--   level          patient-self / treating doctor   nurse (care team)   staff / admin
--   public         value                            value               value
--   internal       value                            value               value
--   confidential   value                            MASKED              MASKED
--   restricted     value                            value               hidden (null)
--
-- Direct SELECT on confidential/restricted patient columns is revoked from
-- clients; they are only reachable through public.patient_directory (masked
-- view) and public.get_patient_profile() (masked + audited).
-- ============================================================================

create table public.data_classification (
  table_name  text not null,
  column_name text not null,
  level       text not null check (level in ('public', 'internal', 'confidential', 'restricted')),
  mask        text not null default 'none'
              check (mask in ('none', 'phone', 'email', 'date', 'address', 'partial_id', 'redact')),
  description text,
  primary key (table_name, column_name)
);

alter table public.data_classification enable row level security;
revoke all on public.data_classification from anon, authenticated;
grant select on public.data_classification to authenticated;
create policy data_classification_read on public.data_classification for select to authenticated using (true);

insert into public.data_classification (table_name, column_name, level, mask, description) values
  ('patients', 'id',                  'internal',     'none',       'Surrogate key'),
  ('patients', 'patient_id',          'internal',     'none',       'Hospital patient number'),
  ('patients', 'first_name',          'internal',     'none',       'Needed to identify the patient in care'),
  ('patients', 'last_name',           'internal',     'none',       null),
  ('patients', 'gender',              'internal',     'none',       null),
  ('patients', 'blood_group',         'internal',     'none',       'Safety-critical in emergencies'),
  ('patients', 'city',                'internal',     'none',       null),
  ('patients', 'state',               'internal',     'none',       null),
  ('patients', 'email',               'confidential', 'email',      'Direct identifier'),
  ('patients', 'phone',               'confidential', 'phone',      'Direct identifier'),
  ('patients', 'phone_number',        'confidential', 'phone',      'Direct identifier'),
  ('patients', 'emergency_contact',   'confidential', 'phone',      'Third-party identifier'),
  ('patients', 'date_of_birth',       'confidential', 'date',       'Quasi-identifier'),
  ('patients', 'address',             'confidential', 'address',    'Direct identifier'),
  ('patients', 'zip_code',            'confidential', 'redact',     'Quasi-identifier'),
  ('patients', 'allergies',           'restricted',   'none',       'Clinical'),
  ('patients', 'current_medications', 'restricted',   'none',       'Clinical'),
  ('patients', 'medical_history',     'restricted',   'none',       'Clinical'),
  ('patients', 'health_profile',      'restricted',   'none',       'Clinical'),
  ('patients', 'password_hash',       'restricted',   'redact',     'Credential: never exposed to clients'),
  ('doctors',  'license_number',      'confidential', 'partial_id', 'Professional registration number'),
  ('nurses',   'license_number',      'confidential', 'partial_id', 'Professional registration number'),
  ('medical_records', 'diagnosis',        'restricted', 'none', 'Clinical; encrypted at rest'),
  ('medical_records', 'treatment_plan',   'restricted', 'none', 'Clinical; encrypted at rest'),
  ('medical_records', 'notes',            'restricted', 'none', 'Clinical; encrypted at rest'),
  ('medical_records', 'symptoms',         'restricted', 'none', 'Clinical'),
  ('prescriptions',   'medication_name',  'restricted', 'none', 'Clinical; encrypted at rest'),
  ('prescriptions',   'instructions',     'restricted', 'none', 'Clinical; encrypted at rest'),
  ('audit_log',       'details',          'internal',   'none', 'Must never contain restricted values'),
  ('ai_query_log',    'query_redacted',   'confidential', 'none', 'Question text after PHI redaction');

-- Mirror the labels into column comments so they show up in any DB tool.
do $$
declare r record;
begin
  for r in
    select c.* from public.data_classification c
    join information_schema.columns i
      on i.table_schema = 'public' and i.table_name = c.table_name and i.column_name = c.column_name
  loop
    execute format('comment on column public.%I.%I is %L', r.table_name, r.column_name,
                   'classification: ' || r.level || coalesce(' - ' || r.description, ''));
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Masking
-- ----------------------------------------------------------------------------
create or replace function private.apply_mask(p_mask text, p_value text) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_value is null then null
    when p_mask = 'none' then p_value
    when p_mask = 'phone' then
      'XXXXXX' || right(regexp_replace(p_value, '\D', '', 'g'), 4)
    when p_mask = 'email' then
      left(p_value, 1) || '***@' || split_part(p_value, '@', 2)
    when p_mask = 'date' then
      left(p_value, 4) || '-XX-XX'
    when p_mask = 'address' then
      '*** ' || btrim(regexp_replace(p_value, '^.*,', ''))
    when p_mask = 'partial_id' then
      repeat('X', greatest(length(p_value) - 3, 0)) || right(p_value, 3)
    else '[redacted]'
  end
$$;

-- Value of one classified column as the current caller may see it.
create or replace function private.classified_value(
  p_table text, p_column text, p_value text, p_patient uuid
) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  c public.data_classification;
  full_access boolean;
  care_team   boolean;
begin
  select * into c from public.data_classification
   where table_name = p_table and column_name = p_column;
  if not found then
    return null;  -- unclassified columns are never released by this path
  end if;

  full_access := p_patient = private.my_patient_id()
              or private.doctor_treats(p_patient)
              or private.has_break_glass(p_patient);
  care_team := full_access or private.nurse_assigned(p_patient);

  return case c.level
    when 'public'       then p_value
    when 'internal'     then p_value
    when 'confidential' then case when full_access then p_value else private.apply_mask(c.mask, p_value) end
    when 'restricted'   then case when care_team then p_value else null end
  end;
end $$;
grant execute on function private.classified_value(text, text, text, uuid) to authenticated;
grant execute on function private.apply_mask(text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Masked patient view
-- ----------------------------------------------------------------------------
-- Deliberately NOT security_invoker: it reads the base table as owner so it
-- can release masked columns the caller has no direct grant on. The WHERE
-- clause re-applies the same row authorization + MFA the table's RLS uses.
create or replace view public.patient_directory as
select
  p.id,
  p.patient_id,
  p.first_name,
  p.last_name,
  p.gender,
  p.blood_group,
  p.city,
  p.state,
  private.classified_value('patients', 'email',             p.email,             p.id) as email,
  private.classified_value('patients', 'phone',             p.phone,             p.id) as phone,
  private.classified_value('patients', 'phone_number',      p.phone_number,      p.id) as phone_number,
  private.classified_value('patients', 'emergency_contact', p.emergency_contact, p.id) as emergency_contact,
  private.classified_value('patients', 'date_of_birth',     p.date_of_birth::text, p.id) as date_of_birth,
  private.classified_value('patients', 'address',           p.address,           p.id) as address,
  private.classified_value('patients', 'zip_code',          p.zip_code,          p.id) as zip_code,
  private.classified_value('patients', 'allergies',         p.allergies,         p.id) as allergies,
  private.classified_value('patients', 'current_medications', p.current_medications, p.id) as current_medications,
  private.classified_value('patients', 'medical_history',   p.medical_history,   p.id) as medical_history,
  private.classified_value('patients', 'health_profile',    p.health_profile::text, p.id)::jsonb as health_profile,
  p.is_profile_completed
from public.patients p
where private.can_view_patient(p.id)
  and private.mfa_satisfied();

revoke all on public.patient_directory from anon, public;
grant select on public.patient_directory to authenticated;

-- Narrow direct access: names/IDs stay readable (joins, lists), everything
-- confidential or restricted now goes through patient_directory.
revoke select on public.patients from authenticated;
grant select (id, patient_id, first_name, last_name, gender, blood_group, city, state,
              is_profile_completed, created_at, updated_at, auth_user_id)
  on public.patients to authenticated;

revoke select on public.doctors from authenticated;
grant select (id, doctor_id, first_name, last_name, email, phone, specialization,
              department, years_of_experience, created_at, updated_at, auth_user_id)
  on public.doctors to authenticated;
revoke select on public.nurses from authenticated;
grant select (id, nurse_id, first_name, last_name, email, phone,
              department, shift, created_at, updated_at, auth_user_id)
  on public.nurses to authenticated;

-- Full profile for one patient, masked for the caller, and audited.
create or replace function public.get_patient_profile(p_patient_id uuid)
returns setof public.patient_directory
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.patient_directory d where d.id = p_patient_id) then
    return;
  end if;
  if p_patient_id is distinct from private.my_patient_id() then
    perform private.append_audit(
      case when private.via_break_glass(p_patient_id) then 'break_glass_read' else 'view_patient_profile' end,
      'patients', p_patient_id::text, p_patient_id);
  end if;
  return query select * from public.patient_directory d where d.id = p_patient_id;
end $$;
revoke all on function public.get_patient_profile from public, anon;
grant execute on function public.get_patient_profile to authenticated;
