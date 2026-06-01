-- Neuro-rehab 12-week program: event metadata, wiki reference pages, daily journal.

alter table public.rehab_plan_events
  add column event_kind text not null default 'custom',
  add column program_id text,
  add column plan_week smallint;

alter table public.rehab_plan_events
  add constraint rehab_plan_events_event_kind_valid check (
    event_kind in (
      'gym_a', 'gym_b', 'gym_c', 'gym_d',
      'run_walk', 'hand', 'speech', 'football',
      'meditation', 'journal', 'supplement',
      'weekly_review', 'retest', 'day0', 'recovery', 'custom'
    )
  );

alter table public.rehab_plan_events
  add constraint rehab_plan_events_plan_week_range check (
    plan_week is null or (plan_week >= 1 and plan_week <= 12)
  );

create index rehab_plan_events_user_program_start_idx
  on public.rehab_plan_events (user_id, program_id, start_at);

create table public.rehab_wiki_pages (
  slug text primary key,
  title text not null,
  body text not null,
  parent_slug text references public.rehab_wiki_pages (slug) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rehab_wiki_pages_title_not_blank check (length(trim(title)) > 0)
);

create index rehab_wiki_pages_parent_sort_idx
  on public.rehab_wiki_pages (parent_slug, sort_order);

create trigger rehab_wiki_pages_set_updated_at
  before update on public.rehab_wiki_pages
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rehab_wiki_pages enable row level security;

create policy "rehab_wiki_pages_select_authenticated" on public.rehab_wiki_pages
  for select to authenticated using (true);

create table public.rehab_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rehab_journal_entries_user_date_unique unique (user_id, entry_date)
);

create index rehab_journal_entries_user_date_idx
  on public.rehab_journal_entries (user_id, entry_date desc);

create trigger rehab_journal_entries_set_updated_at
  before update on public.rehab_journal_entries
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rehab_journal_entries enable row level security;

create policy "rehab_journal_entries_select_own" on public.rehab_journal_entries
  for select using (auth.uid() = user_id);

create policy "rehab_journal_entries_insert_own" on public.rehab_journal_entries
  for insert with check (auth.uid() = user_id);

create policy "rehab_journal_entries_update_own" on public.rehab_journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rehab_journal_entries_delete_own" on public.rehab_journal_entries
  for delete using (auth.uid() = user_id);
