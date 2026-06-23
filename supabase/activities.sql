-- Activities table for student portfolio tracking
-- Run after schema.sql in the Supabase SQL Editor

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Users can view own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activities"
  on public.activities for update
  using (auth.uid() = user_id);

create policy "Users can delete own activities"
  on public.activities for delete
  using (auth.uid() = user_id);

create index if not exists activities_user_id_idx
  on public.activities (user_id);

create index if not exists activities_date_idx
  on public.activities (date desc);
