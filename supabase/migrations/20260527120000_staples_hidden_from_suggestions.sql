-- Persist "swipe away" on suggested staples so dismissals survive reload.

alter table public.staples
  add column if not exists hidden_from_suggestions boolean not null default false;

comment on column public.staples.hidden_from_suggestions is
  'When true, staple is omitted from the Suggested chips on the shopping page.';
