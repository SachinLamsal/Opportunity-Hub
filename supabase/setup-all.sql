-- =============================================================================
-- OpportunityHub — COMPLETE Supabase schema (paste into SQL Editor → Run)
-- Generated from the actual codebase in ~/opportunityhub
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS
-- After running: optionally run supabase/seed-opportunities.sql for sample data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- Used by: lib/actions/auth.ts (signup upsert, updateProfile, getProfile)
--          lib/actions/ai.ts, lib/cv/generate.ts, dashboard, profile page
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  education_level text,
  dream_universities text,
  subjects text,
  interests text,
  career_interests text,
  awards text,
  volunteer_work text,
  leadership_roles text,
  projects text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user; created on signup';

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile when auth user is created (works even before email confirm)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    education_level,
    dream_universities
  )
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'education_level',
    new.raw_user_meta_data->>'dream_universities'
  )
  on conflict (id) do update set
    email = excluded.email,
    education_level = coalesce(excluded.education_level, public.profiles.education_level),
    dream_universities = coalesce(excluded.dream_universities, public.profiles.dream_universities);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. opportunities
-- Used by: lib/queries/opportunities.ts, lib/actions/ai.ts, dashboard, feed
-- ---------------------------------------------------------------------------

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
  is_online boolean not null default false,
  subject_area text,
  grade_requirements text,
  cost text,
  time_commitment text,
  skills_gained text,
  difficulty_level text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;

drop policy if exists "Authenticated users can view opportunities" on public.opportunities;
create policy "Authenticated users can view opportunities"
  on public.opportunities for select
  to authenticated
  using (true);

create index if not exists opportunities_created_at_idx
  on public.opportunities (created_at desc);

create index if not exists opportunities_subject_area_idx
  on public.opportunities (subject_area);

create index if not exists opportunities_type_idx
  on public.opportunities (type);

create index if not exists opportunities_deadline_idx
  on public.opportunities (deadline);

-- ---------------------------------------------------------------------------
-- 3. saved_opportunities
-- Used by: lib/actions/opportunities.ts, lib/queries/opportunities.ts
-- ---------------------------------------------------------------------------

create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_opportunities_user_opportunity_unique unique (user_id, opportunity_id)
);

alter table public.saved_opportunities enable row level security;

drop policy if exists "Users can view own saved opportunities" on public.saved_opportunities;
create policy "Users can view own saved opportunities"
  on public.saved_opportunities for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can save opportunities" on public.saved_opportunities;
create policy "Users can save opportunities"
  on public.saved_opportunities for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can unsave opportunities" on public.saved_opportunities;
create policy "Users can unsave opportunities"
  on public.saved_opportunities for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists saved_opportunities_user_id_idx
  on public.saved_opportunities (user_id);

create index if not exists saved_opportunities_opportunity_id_idx
  on public.saved_opportunities (opportunity_id);

-- ---------------------------------------------------------------------------
-- 4. activities
-- Used by: lib/actions/activities.ts, lib/queries/activities.ts, portfolio, CV
-- ---------------------------------------------------------------------------

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

drop policy if exists "Users can view own activities" on public.activities;
create policy "Users can view own activities"
  on public.activities for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own activities" on public.activities;
create policy "Users can insert own activities"
  on public.activities for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own activities" on public.activities;
create policy "Users can update own activities"
  on public.activities for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own activities" on public.activities;
create policy "Users can delete own activities"
  on public.activities for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists activities_user_id_idx
  on public.activities (user_id);

create index if not exists activities_date_idx
  on public.activities (date desc);

create index if not exists activities_created_at_idx
  on public.activities (created_at desc);

-- ---------------------------------------------------------------------------
-- Grants (required for PostgREST / Supabase client access)
-- ---------------------------------------------------------------------------

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant all on all sequences in schema public to postgres, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Reload PostgREST schema cache (fixes "table not found in schema cache")
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
