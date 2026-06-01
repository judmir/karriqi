-- Per-subtask completion for clinical checklist items (indices into catalog bullet list).

alter table public.rehab_clinical_item_state
  add column if not exists subtasks_done integer[] not null default '{}';
