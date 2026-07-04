import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { CalendarView } from "@/types/calendar";

/** Visible date range for a calendar view (month grid includes adjacent-month days). */
export function calendarViewRange(
  view: CalendarView,
  date: Date,
): { start: Date; end: Date } {
  switch (view) {
    case "month":
      return {
        start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
      };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "agenda":
    default:
      return { start: startOfDay(date), end: endOfDay(addDays(date, 60)) };
  }
}

export function calendarViewRangeKey(view: CalendarView, date: Date): string {
  const { start, end } = calendarViewRange(view, date);
  return `${view}:${start.toISOString()}:${end.toISOString()}`;
}
