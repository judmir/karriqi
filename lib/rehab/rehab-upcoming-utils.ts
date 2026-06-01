import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { eventSpansDay } from "@/lib/calendar/all-day-events";
import { PROGRAM_START, PROGRAM_WEEKS } from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEvent } from "@/types/rehab";

/** Each "See more" reveals this many additional day rows (2 weeks). */
export const UPCOMING_DAYS_CHUNK = 14;

/** Initial day rows on first load (also 2 weeks). */
export const UPCOMING_INITIAL_DAYS = UPCOMING_DAYS_CHUNK;

/** @deprecated Use UPCOMING_INITIAL_DAYS */
export const UPCOMING_NEAR_DAYS = UPCOMING_INITIAL_DAYS;

export type UpcomingListSection =
  | { kind: "overdue"; events: RehabPlanEvent[] }
  | { kind: "day"; date: Date; label: string; events: RehabPlanEvent[] };

const PROGRAM_END = addDays(PROGRAM_START, PROGRAM_WEEKS * 7 - 1);

function byStart(a: RehabPlanEvent, b: RehabPlanEvent): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

function eventPrimaryDay(event: RehabPlanEvent): Date {
  if (event.allDay) {
    const [year, month, day] = event.startAt.slice(0, 10).split("-").map(Number);
    return new Date(year!, month! - 1, day!);
  }
  return startOfDay(parseISO(event.startAt));
}

export function upcomingEventScheduleLabel(
  event: RehabPlanEvent,
  now: Date = new Date(),
): string {
  const today = startOfDay(now);
  const datePart = upcomingDayLabel(eventPrimaryDay(event), today);
  if (event.allDay || event.completedAt) {
    return datePart;
  }
  return `${datePart} · ${format(parseISO(event.startAt), "HH:mm")}`;
}

/** Match title or description across all events (including completed). */
export function filterUpcomingEventsBySearch(
  events: RehabPlanEvent[],
  query: string,
): RehabPlanEvent[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return events
    .filter((event) => {
      const title = event.title.toLowerCase();
      const description = event.description?.toLowerCase() ?? "";
      return title.includes(normalized) || description.includes(normalized);
    })
    .sort(byStart);
}

function isOverdue(event: RehabPlanEvent, today: Date): boolean {
  if (event.completedAt) {
    return false;
  }
  return isBefore(eventPrimaryDay(event), today);
}

function activeEvents(events: RehabPlanEvent[]): RehabPlanEvent[] {
  return events.filter((event) => !event.completedAt);
}

export function upcomingDayLabel(date: Date, today: Date): string {
  const tomorrow = addDays(today, 1);
  if (isSameDay(date, today)) {
    return `Today ${format(date, "d MMM")}`;
  }
  if (isSameDay(date, tomorrow)) {
    return `Tomorrow ${format(date, "d MMM")}`;
  }
  return format(date, "EEE d MMM");
}

/** Total day rows available from today through program end. */
export function maxUpcomingDaysFrom(now: Date = new Date()): number {
  const today = startOfDay(now);
  const throughProgram = differenceInCalendarDays(PROGRAM_END, today) + 1;
  return Math.max(UPCOMING_DAYS_CHUNK, throughProgram);
}

export function hasMoreUpcomingDays(
  visibleDays: number,
  now: Date = new Date(),
): boolean {
  return visibleDays < maxUpcomingDaysFrom(now);
}

export function nextUpcomingVisibleDays(current: number, now: Date = new Date()): number {
  return Math.min(current + UPCOMING_DAYS_CHUNK, maxUpcomingDaysFrom(now));
}

/** Overdue + one row per day for the visible window. */
export function buildUpcomingListSections(
  events: RehabPlanEvent[],
  now: Date = new Date(),
  visibleDays: number = UPCOMING_INITIAL_DAYS,
): UpcomingListSection[] {
  const today = startOfDay(now);
  const active = activeEvents(events);
  const sections: UpcomingListSection[] = [];
  const dayCount = Math.min(visibleDays, maxUpcomingDaysFrom(now));

  const overdue = active.filter((event) => isOverdue(event, today)).sort(byStart);
  if (overdue.length > 0) {
    sections.push({ kind: "overdue", events: overdue });
  }

  for (let offset = 0; offset < dayCount; offset++) {
    const date = addDays(today, offset);
    const dayEvents = active
      .filter(
        (event) => eventSpansDay(event, date) && !isOverdue(event, today),
      )
      .sort(byStart);

    sections.push({
      kind: "day",
      date,
      label: upcomingDayLabel(date, today),
      events: dayEvents,
    });
  }

  return sections;
}

/** @deprecated Use buildUpcomingListSections with visibleDays */
export function buildUpcomingNearSections(
  events: RehabPlanEvent[],
  now?: Date,
  visibleDays?: number,
): UpcomingListSection[] {
  return buildUpcomingListSections(events, now, visibleDays);
}

/** Default start when adding a task on a day row. */
export function defaultStartForUpcomingDay(day: Date): Date {
  const start = startOfDay(day);
  start.setHours(9, 0, 0, 0);
  return start;
}

/** @deprecated Month buckets removed; use defaultStartForUpcomingDay */
export function defaultStartForUpcomingMonth(month: Date): Date {
  const start = startOfMonth(month);
  start.setHours(9, 0, 0, 0);
  return start;
}
