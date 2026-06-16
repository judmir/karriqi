import { endOfDay, startOfDay } from "date-fns";

import {
  expandRehabEvents,
  parseOccurrenceId,
} from "@/lib/rehab/expand-rehab-events";
import type { RehabPlanEvent } from "@/types/rehab";

/** Resolve a rehab event by id, including virtual recurring occurrences. */
export function resolveRehabPlanEventById(
  events: RehabPlanEvent[],
  id: string,
): RehabPlanEvent | null {
  const direct = events.find((event) => event.id === id);
  if (direct) {
    return direct;
  }

  const parsed = parseOccurrenceId(id);
  if (!parsed) {
    return null;
  }

  const occurrenceDate = new Date(parsed.occurrenceMs);
  const expanded = expandRehabEvents(
    events,
    startOfDay(occurrenceDate),
    endOfDay(occurrenceDate),
  );

  return expanded.find((event) => event.id === id) ?? null;
}
