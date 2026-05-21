-- Jira-style task priority (highest → lowest).
alter table public.todo_items
  add column priority text not null default 'medium'
  constraint todo_items_priority_valid
    check (priority in ('highest', 'high', 'medium', 'low', 'lowest'));

create index todo_items_user_status_priority_position_idx
  on public.todo_items (user_id, status, priority, position);
