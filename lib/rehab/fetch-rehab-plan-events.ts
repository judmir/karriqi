import { startOfDay } from "date-fns";

import {
  mapRehabPlanEvent,
  REHAB_PLAN_EVENT_SELECT,
  type RehabPlanEventRow,
} from "@/lib/rehab/rehab-plan-event-map";
import { filterRehabEventsForDay } from "@/lib/rehab/rehab-today-utils";
import { createClient } from "@/lib/supabase/server";
import type { RehabPlanEvent } from "@/types/rehab";

export async function fetchRehabPlanEventsForUser(): Promise<RehabPlanEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_plan_events")
    .select(REHAB_PLAN_EVENT_SELECT)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRehabPlanEvent(row as RehabPlanEventRow));
}

export async function fetchRehabTodayEventsForUser(): Promise<RehabPlanEvent[]> {
  const events = await fetchRehabPlanEventsForUser();
  return filterRehabEventsForDay(events, startOfDay(new Date()));
}
