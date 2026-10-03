-- ============================================================================
-- PERMISSION-AWARE RAG
-- ============================================================================
-- record_chunks holds embeddings of clinical records for the assistant.
--
-- Design note: embeddings are computed from plaintext, so this table is as
-- sensitive as the records themselves. It gets the same RLS as the source
-- tables (can_view_clinical + aal2), and retrieval runs through
-- match_records(), which is SECURITY INVOKER: the similarity search itself
-- is filtered by the caller's RLS, so the model can never be handed a chunk
-- the user could not have opened. The chunk text is envelope-encrypted like
-- the source columns; only the server decrypts it.
-- ============================================================================

create extension if not exists vector with schema extensions;

create table public.record_chunks (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.patients (id) on delete cascade,
  source_table     text not null check (source_table in ('medical_records', 'prescriptions')),
  source_id        uuid not null,
  chunk_index      int  not null,
  -- chunk_text, envelope-encrypted (same scheme as medical_records)
  phi_ciphertext   bytea not null,
  phi_iv           bytea not null,
  phi_auth_tag     bytea not null,
  encrypted_dek    bytea not null,
  key_version      int not null references public.encryption_keys (version),
  embedding        extensions.vector(768) not null,
  flagged_injection boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (source_table, source_id, chunk_index)
);

create index record_chunks_patient_idx on public.record_chunks (patient_id);
create index record_chunks_source_idx  on public.record_chunks (source_table, source_id);
create index record_chunks_key_version_idx on public.record_chunks (key_version);
create index record_chunks_embedding_idx on public.record_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.record_chunks enable row level security;
revoke all on public.record_chunks from anon, authenticated;
grant select on public.record_chunks to authenticated;   -- writes: server indexer only

create policy record_chunks_select on public.record_chunks for select to authenticated
  using (private.can_view_clinical(patient_id));
create policy record_chunks_require_aal2 on public.record_chunks as restrictive for all to authenticated
  using ((select private.mfa_satisfied()));

-- ----------------------------------------------------------------------------
-- Retrieval
-- ----------------------------------------------------------------------------
create or replace function public.match_records(
  query_embedding extensions.vector(768),
  match_count int default 6,
  min_similarity float default 0.3,
  p_patient_id uuid default null
)
returns table (
  id uuid, patient_id uuid, source_table text, source_id uuid, chunk_index int,
  phi_ciphertext bytea, phi_iv bytea, phi_auth_tag bytea, encrypted_dek bytea,
  key_version int, flagged_injection boolean, similarity float
)
language plpgsql stable security invoker set search_path = '' as $$
begin
  return query
    select c.id, c.patient_id, c.source_table, c.source_id, c.chunk_index,
           c.phi_ciphertext, c.phi_iv, c.phi_auth_tag, c.encrypted_dek, c.key_version,
           c.flagged_injection,
           1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
    from public.record_chunks c           -- RLS applies here, as the caller
    where (p_patient_id is null or c.patient_id = p_patient_id)
      and 1 - (c.embedding operator(extensions.<=>) query_embedding) >= min_similarity
    order by c.embedding operator(extensions.<=>) query_embedding
    limit least(match_count, 20);
end $$;
revoke all on function public.match_records from public, anon;
grant execute on function public.match_records to authenticated;

-- ----------------------------------------------------------------------------
-- Re-embedding: writes enqueue a job; the server indexer drains the queue
-- (it has to, since only the server can decrypt the source text).
-- ----------------------------------------------------------------------------
create table public.embedding_jobs (
  source_table text not null,
  source_id    uuid not null,
  enqueued_at  timestamptz not null default now(),
  attempts     int not null default 0,
  last_error   text,
  primary key (source_table, source_id)
);
alter table public.embedding_jobs enable row level security;
revoke all on public.embedding_jobs from anon, authenticated;

create or replace function private.enqueue_embedding() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.record_chunks where source_table = tg_table_name and source_id = old.id;
    delete from public.embedding_jobs where source_table = tg_table_name and source_id = old.id;
    return old;
  end if;
  insert into public.embedding_jobs (source_table, source_id)
  values (tg_table_name, new.id)
  on conflict (source_table, source_id)
    do update set enqueued_at = now(), attempts = 0, last_error = null;
  return new;
end $$;

create trigger medical_records_embed after insert or update or delete on public.medical_records
  for each row execute function private.enqueue_embedding();
create trigger prescriptions_embed after insert or update or delete on public.prescriptions
  for each row execute function private.enqueue_embedding();

-- Backfill: everything already present needs embedding.
insert into public.embedding_jobs (source_table, source_id)
select 'medical_records', id from public.medical_records
union all
select 'prescriptions', id from public.prescriptions
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- AI audit log (OWASP LLM: traceability). Admin-read only.
-- ----------------------------------------------------------------------------
create table public.ai_query_log (
  id                   bigint generated always as identity primary key,
  user_id              text not null,
  user_role            text not null,
  query_redacted       text not null,
  retrieved_chunk_ids  uuid[] not null default '{}',
  retrieved_record_ids text[] not null default '{}',
  injection_flags      int not null default 0,
  outcome              text not null check (outcome in
                         ('answered', 'no_records', 'rejected_uncited', 'blocked', 'error')),
  model                text,
  latency_ms           int,
  created_at           timestamptz not null default now()
);
create index ai_query_log_user_ts_idx on public.ai_query_log (user_id, created_at desc);

alter table public.ai_query_log enable row level security;
revoke all on public.ai_query_log from anon, authenticated;
grant select on public.ai_query_log to authenticated;
create policy ai_query_log_admin_select on public.ai_query_log for select to authenticated
  using ((select private.is_admin()));
create policy ai_query_log_require_aal2 on public.ai_query_log as restrictive for all to authenticated
  using ((select private.mfa_satisfied()));

-- Show AI retrievals in the patient's "who accessed my record" view.
comment on table public.ai_query_log is
  'One row per assistant question. query_redacted has identifiers masked before storage.';
