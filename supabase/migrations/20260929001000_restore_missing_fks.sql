-- ============================================================================
-- RESTORE FOREIGN KEYS MISSING FROM PRODUCTION
-- ============================================================================
-- complete-setup.sql declares these, but the production database (and so the
-- baseline restored from it) never got them. Besides integrity, PostgREST
-- needs them to embed related rows (e.g. prescriptions -> appointments).
-- NOT VALID: enforced for new/updated rows without failing on any orphaned
-- historical rows; run VALIDATE CONSTRAINT after checking for orphans.
-- ============================================================================
alter table public.prescriptions
  add constraint prescriptions_appointment_id_fkey
  foreign key (appointment_id) references public.appointments (id) on delete cascade not valid;
alter table public.video_calls
  add constraint video_calls_appointment_id_fkey
  foreign key (appointment_id) references public.appointments (id) on delete cascade not valid;
alter table public.video_call_logs
  add constraint video_call_logs_appointment_id_fkey
  foreign key (appointment_id) references public.appointments (id) on delete cascade not valid;
alter table public.medical_report_logs
  add constraint medical_report_logs_report_id_fkey
  foreign key (report_id) references public.medical_reports (id) on delete cascade not valid;

create index if not exists video_calls_appointment_idx on public.video_calls (appointment_id);
create index if not exists video_call_logs_appointment_idx on public.video_call_logs (appointment_id);
create index if not exists medical_report_logs_report_idx on public.medical_report_logs (report_id);

notify pgrst, 'reload schema';
