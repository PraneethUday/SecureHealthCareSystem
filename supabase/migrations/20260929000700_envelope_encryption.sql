-- ============================================================================
-- FIELD-LEVEL ENVELOPE ENCRYPTION (AES-256-GCM)
-- ============================================================================
-- Sensitive clinical fields are encrypted by the Next.js server before they
-- reach Postgres:
--   * each row gets a random 256-bit data key (DEK)
--   * the fields are serialized together and encrypted with the DEK
--     (AES-256-GCM, random 12-byte IV, auth tag kept, AAD = "table:row_id")
--   * the DEK is wrapped with the key-encryption key (KEK) and stored in
--     encrypted_dek, together with the KEK's key_version
--   * KEKs live in Supabase Vault and are readable only by the service role
--
-- Rotation creates a new KEK and re-wraps DEKs (scripts/rotate-kek.ts);
-- record ciphertext is never touched.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Key registry (KEK material itself lives in vault.secrets)
-- ----------------------------------------------------------------------------
create table public.encryption_keys (
  version         int primary key,
  vault_secret_id uuid not null,
  created_at      timestamptz not null default now(),
  retired_at      timestamptz
);
alter table public.encryption_keys enable row level security;
revoke all on public.encryption_keys from anon, authenticated;

-- Generates a new 256-bit KEK inside the database, so the key is never
-- typed, logged or passed through application code on creation.
create or replace function public.create_kek_version() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_version int;
  v_secret  uuid;
begin
  perform pg_advisory_xact_lock(hashtext('public.encryption_keys'));
  select coalesce(max(version), 0) + 1 into v_version from public.encryption_keys;
  v_secret := vault.create_secret(
    encode(extensions.gen_random_bytes(32), 'base64'),
    'medisecure_kek_v' || v_version,
    'MediSecure key-encryption key, version ' || v_version
  );
  insert into public.encryption_keys (version, vault_secret_id) values (v_version, v_secret);
  return v_version;
end $$;

create or replace function public.current_kek_version() returns int
language sql stable security definer set search_path = '' as $$
  select max(version) from public.encryption_keys where retired_at is null
$$;

create or replace function public.kek_material(p_version int) returns text
language sql stable security definer set search_path = '' as $$
  select s.decrypted_secret
  from public.encryption_keys k
  join vault.decrypted_secrets s on s.id = k.vault_secret_id
  where k.version = p_version
$$;

create or replace function public.retire_kek_version(p_version int) returns void
language sql security definer set search_path = '' as $$
  update public.encryption_keys set retired_at = now()
  where version = p_version and retired_at is null
$$;

revoke all on function public.create_kek_version(), public.current_kek_version(),
  public.kek_material(int), public.retire_kek_version(int) from public, anon, authenticated;
grant execute on function public.create_kek_version(), public.current_kek_version(),
  public.kek_material(int), public.retire_kek_version(int) to service_role;

select public.create_kek_version()
where not exists (select 1 from public.encryption_keys);

-- ----------------------------------------------------------------------------
-- Envelope columns
-- ----------------------------------------------------------------------------
alter table public.medical_records
  add column phi_ciphertext bytea,
  add column phi_iv         bytea,
  add column phi_auth_tag   bytea,
  add column encrypted_dek  bytea,
  add column key_version    int references public.encryption_keys (version),
  alter column chief_complaint drop not null,
  alter column diagnosis drop not null;

alter table public.prescriptions
  add column phi_ciphertext bytea,
  add column phi_iv         bytea,
  add column phi_auth_tag   bytea,
  add column encrypted_dek  bytea,
  add column key_version    int references public.encryption_keys (version),
  alter column medication_name drop not null,
  alter column dosage drop not null;

create index medical_records_key_version_idx on public.medical_records (key_version);
create index prescriptions_key_version_idx on public.prescriptions (key_version);

-- New and updated rows must be encrypted, with no plaintext left behind in
-- the protected columns. NOT VALID: rows written before this migration are
-- encrypted by scripts/encrypt-existing-records.ts, after which run
--   alter table ... validate constraint ...;
alter table public.medical_records add constraint medical_records_phi_encrypted check (
  phi_ciphertext is not null and phi_iv is not null and phi_auth_tag is not null
  and encrypted_dek is not null and key_version is not null
  and chief_complaint is null and diagnosis is null and symptoms is null
  and examination_findings is null and treatment_plan is null
  and recommendations is null and notes is null
) not valid;

alter table public.prescriptions add constraint prescriptions_phi_encrypted check (
  phi_ciphertext is not null and phi_iv is not null and phi_auth_tag is not null
  and encrypted_dek is not null and key_version is not null
  and medication_name is null and dosage is null and instructions is null and notes is null
) not valid;

-- The change logs used to keep full before/after copies of each row, i.e. a
-- plaintext duplicate of everything above. They now record which fields
-- changed, never the values.
update public.medical_record_logs set old_data = null, new_data = null;
update public.prescription_logs  set old_data = null, new_data = null;
alter table public.medical_record_logs add constraint medical_record_logs_no_phi
  check (old_data is null and new_data is null);
alter table public.prescription_logs add constraint prescription_logs_no_phi
  check (old_data is null and new_data is null);
