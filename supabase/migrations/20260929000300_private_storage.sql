-- ============================================================================
-- PRIVATE STORAGE BUCKETS
-- ============================================================================
-- Medical reports and chat attachments were served through public URLs:
-- anyone holding (or guessing) a link could download PHI. Both buckets are
-- now private. The API authorizes the caller against the database row under
-- RLS and then hands out a short-lived signed URL.
-- No storage.objects policies are created, so clients cannot list or read
-- objects directly; only the server (service role) can.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('medical-reports', 'medical-reports', false),
       ('chat-attachments', 'chat-attachments', false)
on conflict (id) do update set public = false;
