-- Optional assignee (household); row owner remains user_id.
alter table public.todo_items
  add column assigned_email text;

comment on column public.todo_items.assigned_email is
  'Lowercase email of assignee for display/picker; optional.';
