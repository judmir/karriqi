-- Optional tag + single list ordering (no kanban columns in UI).

alter table public.todo_items add column category text;

alter table public.todo_items add column list_order integer not null default 0;

create index todo_items_user_list_order_idx on public.todo_items (user_id, list_order);

-- Backfill list_order from previous status/position ordering.
with ordered as (
  select
    id,
    row_number() over (
      partition by user_id
      order by
        case status
          when 'in_progress' then 0
          when 'backlog' then 1
          when 'done' then 2
        end,
        position
    ) as rn
  from public.todo_items
)
update public.todo_items t
set list_order = ordered.rn
from ordered
where t.id = ordered.id;
