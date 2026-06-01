import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import type { CalendarEventActions } from "@/lib/calendar/calendar-event-actions";

/** Rehab calendar forms and DnD use the store (optimistic + Supabase sync). */
export const rehabPlanEventActions: CalendarEventActions = {
  create: (input) => useRehabPlanStore.getState().createEvent(input),
  update: (input) => useRehabPlanStore.getState().updateEvent(input),
  delete: (id) => useRehabPlanStore.getState().deleteEvent(id),
};
