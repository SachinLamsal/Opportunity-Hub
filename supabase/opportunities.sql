-- Opportunities & saved_opportunities tables
-- Run after schema.sql in the Supabase SQL Editor

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  description text not null,
  organizer text,
  registration_link text,
  deadline date,
  start_date date,
  end_date date,
  location text,
  is_online boolean default false,
  subject_area text,
  grade_requirements text,
  cost text,
  time_commitment text,
  skills_gained text,
  difficulty_level text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;

-- Anyone logged in can read opportunities
create policy "Authenticated users can view opportunities"
  on public.opportunities for select
  to authenticated
  using (true);

create policy "Users can view own saved opportunities"
  on public.saved_opportunities for select
  using (auth.uid() = user_id);

create policy "Users can save opportunities"
  on public.saved_opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave opportunities"
  on public.saved_opportunities for delete
  using (auth.uid() = user_id);

create index if not exists opportunities_created_at_idx
  on public.opportunities (created_at desc);

create index if not exists opportunities_subject_area_idx
  on public.opportunities (subject_area);

create index if not exists opportunities_type_idx
  on public.opportunities (type);

create index if not exists saved_opportunities_user_id_idx
  on public.saved_opportunities (user_id);
