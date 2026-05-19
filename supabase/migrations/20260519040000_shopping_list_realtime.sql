-- Enable Supabase Realtime for the shared shopping list so household
-- members see each other's adds / checks / removals live without reload.
--
-- Two pieces are needed:
--   1. Add the table to the `supabase_realtime` publication so its WAL
--      changes are broadcast over the websocket. Postgres errors if you
--      add a table that is already in the publication, so we guard it.
--   2. Set REPLICA IDENTITY FULL so UPDATE / DELETE events carry the
--      whole previous row (we read `old.id` on DELETE to remove the row
--      from the client cache; the default REPLICA IDENTITY DEFAULT would
--      only include the primary key, which happens to be enough here but
--      FULL keeps options open if we later filter on user_id / position).
--
-- All access is still subject to row-level security, so peers only
-- receive events for rows they could SELECT (i.e. household-scoped).

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'shopping_list_items'
  ) then
    execute 'alter publication supabase_realtime add table public.shopping_list_items';
  end if;
end
$$;

alter table public.shopping_list_items replica identity full;
