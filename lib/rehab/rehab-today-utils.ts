import { format, isSameDay, parseISO, startOfDay } from "date-fns";

import { eventSpansDay } from "@/lib/calendar/all-day-events";
import type { RehabPlanEvent } from "@/types/rehab";

export const REHAB_TODAY_SECTIONS = [
  "all_day",
  "morning",
  "afternoon",
  "evening",
  "completed",
] as const;

export type RehabTodaySection = (typeof REHAB_TODAY_SECTIONS)[number];

export const REHAB_TODAY_SECTION_LABELS: Record<
  Exclude<RehabTodaySection, "completed">,
  string
> = {
  all_day: "All Day",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function rehabTodaySectionForEvent(
  event: RehabPlanEvent,
): RehabTodaySection {
  if (event.completedAt) {
    return "completed";
  }
  if (event.allDay) {
    return "all_day";
  }

  return rehabTodaySectionForHour(parseISO(event.startAt).getHours());
}

export function rehabTodaySectionForSchedule(
  startAt: string,
  allDay: boolean,
): Exclude<RehabTodaySection, "completed"> {
  if (allDay) {
    return "all_day";
  }
  return rehabTodaySectionForHour(parseISO(startAt).getHours());
}

function rehabTodaySectionForHour(
  hour: number,
): Exclude<RehabTodaySection, "completed"> {
  if (hour < 12) {
    return "morning";
  }
  if (hour < 17) {
    return "afternoon";
  }
  return "evening";
}

export function parseTodayAddSectionId(
  addId: string,
): Exclude<RehabTodaySection, "completed"> | null {
  if (!addId.startsWith("today-")) {
    return null;
  }
  const section = addId.slice("today-".length) as RehabTodaySection;
  if (section === "completed" || !REHAB_TODAY_SECTIONS.includes(section)) {
    return null;
  }
  return section;
}

export function isSameRehabDay(a: Date, b: Date): boolean {
  return isSameDay(startOfDay(a), startOfDay(b));
}

export function filterRehabEventsForDay(
  events: RehabPlanEvent[],
  day: Date,
): RehabPlanEvent[] {
  return events.filter((event) => eventSpansDay(event, day));
}

export function groupRehabTodayEvents(events: RehabPlanEvent[]): Record<
  RehabTodaySection,
  RehabPlanEvent[]
> {
  const groups: Record<RehabTodaySection, RehabPlanEvent[]> = {
    all_day: [],
    morning: [],
    afternoon: [],
    evening: [],
    completed: [],
  };

  for (const event of events) {
    groups[rehabTodaySectionForEvent(event)].push(event);
  }

  const byStart = (a: RehabPlanEvent, b: RehabPlanEvent) =>
    new Date(a.startAt).getTime() - new Date(b.startAt).getTime();

  for (const section of REHAB_TODAY_SECTIONS) {
    groups[section].sort(byStart);
  }

  return groups;
}

export function rehabEventTimeLabel(event: RehabPlanEvent): string | null {
  if (event.allDay || event.completedAt) {
    return null;
  }
  return format(parseISO(event.startAt), "HH:mm");
}

export function defaultStartForRehabSection(
  section: Exclude<RehabTodaySection, "completed">,
  day: Date,
): Date {
  const start = new Date(day);
  if (section === "all_day") {
    start.setHours(9, 0, 0, 0);
    return start;
  }
  const hour =
    section === "morning" ? 9 : section === "afternoon" ? 12 : 18;
  start.setHours(hour, 0, 0, 0);
  return start;
}
