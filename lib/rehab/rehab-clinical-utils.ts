import { format } from "date-fns";

import { ROUTES } from "@/config/routes";
import type { RehabPlanEvent } from "@/types/rehab";

export function findClinicalCalendarAnchors(events: RehabPlanEvent[]) {
  const day0 = events.find((event) => event.eventKind === "day0") ?? null;
  const retests = events
    .filter((event) => event.eventKind === "retest")
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  const finalRetest = retests.at(-1) ?? null;

  return { day0, finalRetest };
}

export function clinicalCalendarLabel(event: RehabPlanEvent): string {
  const date = format(new Date(event.startAt), "MMM d, yyyy");
  return `${event.title} — ${date}`;
}

export function rehabUpcomingCalendarHref(startAt: string): string {
  const day = startAt.slice(0, 10);
  return `${ROUTES.rehabPlan}?view=calendar&date=${day}`;
}

export function isClinicalRehabEvent(eventKind: string): boolean {
  return eventKind === "day0" || eventKind === "retest";
}
