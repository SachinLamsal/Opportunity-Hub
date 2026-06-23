-- Run in Supabase SQL Editor AFTER complete-schema.sql
-- Adds AI-enrichable detail fields to opportunities

alter table public.opportunities
  add column if not exists prep_resources text,
  add column if not exists application_steps text,
  add column if not exists eligibility_details text,
  add column if not exists contact_info text,
  add column if not exists ai_summary text,
  add column if not exists portfolio_tips text,
  add column if not exists ai_enriched_at timestamptz,
  add column if not exists source_url text;

comment on column public.opportunities.prep_resources is 'Books, links, practice materials — stored for reuse';
comment on column public.opportunities.ai_enriched_at is 'Last time Gemini enriched this row';

-- Allow authenticated users to save AI enrichments (MVP — tighten with service role in production)
drop policy if exists "Authenticated users can enrich opportunities" on public.opportunities;
create policy "Authenticated users can enrich opportunities"
  on public.opportunities for update
  to authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
