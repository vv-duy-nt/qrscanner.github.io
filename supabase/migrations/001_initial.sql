-- ============================================================
-- QR Studio – Supabase Migration v1
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Folders ────────────────────────────────────────────────

create table if not exists public.folders (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  color        text not null default '#6366f1',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── QR Codes ───────────────────────────────────────────────

create table if not exists public.qr_codes (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text not null default '',
  url          text not null,
  design       jsonb not null default '{}'::jsonb,
  tags         text[] not null default '{}',
  folder_id    text references public.folders(id) on delete set null,
  revision     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Indexes
create index if not exists qr_codes_user_id_idx on public.qr_codes(user_id);
create index if not exists qr_codes_updated_at_idx on public.qr_codes(updated_at desc);
create index if not exists qr_codes_folder_id_idx on public.qr_codes(folder_id);
create index if not exists folders_user_id_idx on public.folders(user_id);

-- ─── Row Level Security ──────────────────────────────────────

alter table public.qr_codes enable row level security;
alter table public.folders enable row level security;

-- QR codes policies
create policy "Users can view their own QR codes"
  on public.qr_codes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own QR codes"
  on public.qr_codes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own QR codes"
  on public.qr_codes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own QR codes"
  on public.qr_codes for delete
  using (auth.uid() = user_id);

-- Folders policies
create policy "Users can view their own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on public.folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- ─── Auto-update updated_at ──────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger qr_codes_updated_at
  before update on public.qr_codes
  for each row execute function public.handle_updated_at();

create trigger folders_updated_at
  before update on public.folders
  for each row execute function public.handle_updated_at();
