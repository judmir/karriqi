-- Rename apartment step kind: closing → movein (move-in & relocation checklist).

alter table public.apartment_step_states
  drop constraint if exists apartment_step_states_kind_check;

update public.apartment_step_states
  set kind = 'movein'
  where kind = 'closing';

alter table public.apartment_step_states
  add constraint apartment_step_states_kind_check
  check (kind in ('progress', 'movein', 'rental'));
