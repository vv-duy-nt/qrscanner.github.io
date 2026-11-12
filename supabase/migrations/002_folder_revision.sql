-- Upgrade existing installations created with migration 001 before folder sync.
alter table public.folders
  add column if not exists revision integer not null default 0;
