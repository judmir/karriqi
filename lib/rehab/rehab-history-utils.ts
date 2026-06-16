import {
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

import { eventSpansDay } from "@/lib/calendar/all-day-events";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEvent } from "@/types/rehab";

/** Each "Load earlier" reveals this many additional past day rows. */
export const HISTORY_DAYS_CHUNK = 14;

export const HISTORY_INITIAL_DAYS = HISTORY_DAYS_CHUNK;

export type HistoryDaySection = {
  date: Date;
  label: string;
  events: RehabPlanEvent[];
  completedCount: number;
};

function byStart(a: RehabPlanEvent, b: RehabPlanEvent): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

export function historyDayLabel(date: Date, today: Date): string {
  const yesterday = subDays(today, 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday · ${format(date, "d MMM")}`;
  }
  return format(date, "EEE d MMM yyyy");
}

/** How many calendar days before today are inside the program (excludes today). */
export function maxHistoryDaysFrom(now: Date = new Date()): number {
  const today = startOfDay(now);
  const programStart = startOfDay(PROGRAM_START);
  if (!isBefore(programStart, today)) {
    return 0;
  }
  return differenceInCalendarDays(today, programStart);
}

export function hasMoreHistoryDays(
  visibleDays: number,
  now: Date = new Date(),
): boolean {
  return visibleDays < maxHistoryDaysFrom(now);
}

export function nextHistoryVisibleDays(
  current: number,
  now: Date = new Date(),
): number {
  return Math.min(current + HISTORY_DAYS_CHUNK, maxHistoryDaysFrom(now));
}

/** Past program days (newest first) that have at least one event. */
export function buildHistoryDaySections(
  events: RehabPlanEvent[],
  now: Date = new Date(),
  visibleDays: number = HISTORY_INITIAL_DAYS,
): HistoryDaySection[] {
  const today = startOfDay(now);
  const programStart = startOfDay(PROGRAM_START);
  const sections: HistoryDaySection[] = [];
  const dayCount = Math.min(visibleDays, maxHistoryDaysFrom(now));

  for (let offset = 1; offset <= dayCount; offset++) {
    const date = subDays(today, offset);
    if (isBefore(date, programStart)) {
      break;
    }

    const dayEvents = events.filter((event) => eventSpansDay(event, date)).sort(byStart);
    if (dayEvents.length === 0) {
      continue;
    }

    const completedCount = dayEvents.filter((event) => event.completedAt).length;

    sections.push({
      date,
      label: historyDayLabel(date, today),
      events: dayEvents,
      completedCount,
    });
  }

  return sections;
}

export function historyEventTimeLabel(event: RehabPlanEvent): string | null {
  if (event.allDay) {
    return "All day";
  }
  return format(parseISO(event.startAt), "HH:mm");
}
