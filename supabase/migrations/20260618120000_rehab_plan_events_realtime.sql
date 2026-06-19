-- Live sync for rehab plan events across PWA, browser, and push actions.

alter table public.rehab_plan_events replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rehab_plan_events'
  ) then
    execute 'alter publication supabase_realtime add table public.rehab_plan_events';
  end if;
end
$$;
