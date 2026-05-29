import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

import {
  allDayFirstDay,
  allDayLastInclusiveDay,
  eventSpansDay,
  parseEventDate,
} from "@/lib/calendar/all-day-events";
import type { CalendarEvent, CalendarView } from "@/types/calendar";

export const WEEK_STARTS_ON = 0 as const;

export const HOUR_HEIGHT_PX = 48;

export const VISIBLE_HOURS = Array.from({ length: 24 }, (_, i) => i);

export { parseEventDate } from "@/lib/calendar/all-day-events";

/** True once the event has fully ended (matches Google Calendar past styling). */
export function isEventPast(event: CalendarEvent, now = new Date()): boolean {
  if (event.allDay) {
    return allDayLastInclusiveDay(event) < startOfDay(now);
  }
  return parseEventDate(event.endAt) < now;
}

export function eventPastClass(event: CalendarEvent, now = new Date()): string {
  return isEventPast(event, now) ? "opacity-45 saturate-[0.65] hover:opacity-55" : "";
}

export function navigateDate(
  date: Date,
  view: CalendarView,
  direction: "prev" | "next" | "today",
): Date {
  if (direction === "today") {
    return startOfDay(new Date());
  }

  const delta = direction === "next" ? 1 : -1;

  switch (view) {
    case "month":
    case "agenda":
      return delta === 1 ? addMonths(date, 1) : subMonths(date, 1);
    case "week":
      return delta === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "day":
      return delta === 1 ? addDays(date, 1) : subDays(date, 1);
  }
}

export function headerLabel(date: Date, view: CalendarView): string {
  switch (view) {
    case "month":
    case "agenda":
      return format(date, "MMMM yyyy");
    case "week": {
      const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
      const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
      if (isSameMonth(start, end)) {
        return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
  }
}

export function monthGridDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start, end });
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => eventSpansDay(event, day))
    .sort(
      (a, b) =>
        parseEventDate(a.startAt).getTime() -
        parseEventDate(b.startAt).getTime(),
    );
}

export function eventsInRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      if (event.allDay) {
        const first = allDayFirstDay(event);
        const last = allDayLastInclusiveDay(event);
        return first <= rangeEnd && last >= rangeStart;
      }
      const start = parseEventDate(event.startAt);
      const end = parseEventDate(event.endAt);
      return start <= rangeEnd && end >= rangeStart;
    })
    .sort(
      (a, b) =>
        parseEventDate(a.startAt).getTime() -
        parseEventDate(b.startAt).getTime(),
    );
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    return "All day";
  }
  const start = parseEventDate(event.startAt);
  const end = parseEventDate(event.endAt);
  if (isSameDay(start, end)) {
    return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`;
}

/** Compact label for month/week chips — time prefix for timed events (Google Calendar style). */
export function formatEventChipLabel(event: CalendarEvent): string {
  if (event.allDay) {
    return event.title;
  }
  const start = parseEventDate(event.startAt);
  return `${format(start, "HH:mm")} ${event.title}`;
}

export function eventColorClasses(color: CalendarEvent["color"]): string {
  switch (color) {
    case "blue":
      return "border-blue-500/30 bg-blue-500/15 text-blue-300";
    case "green":
      return "border-green-500/30 bg-green-500/15 text-green-300";
    case "orange":
      return "border-orange-500/30 bg-orange-500/15 text-orange-300";
    case "purple":
      return "border-purple-500/30 bg-purple-500/15 text-purple-300";
    case "red":
      return "border-red-500/30 bg-red-500/15 text-red-300";
  }
}

export function eventDotClass(color: CalendarEvent["color"]): string {
  switch (color) {
    case "blue":
      return "bg-blue-400";
    case "green":
      return "bg-green-400";
    case "orange":
      return "bg-orange-400";
    case "purple":
      return "bg-purple-400";
    case "red":
      return "bg-red-400";
  }
}

export function timedEventStyle(
  event: CalendarEvent,
  day: Date,
): { top: string; height: string } | null {
  if (event.allDay) {
    return null;
  }

  const start = parseEventDate(event.startAt);
  const end = parseEventDate(event.endAt);
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  const visibleStart = start < dayStart ? dayStart : start;
  const visibleEnd = end > dayEnd ? dayEnd : end;

  const startMinutes =
    visibleStart.getHours() * 60 + visibleStart.getMinutes();
  const endMinutes = visibleEnd.getHours() * 60 + visibleEnd.getMinutes();
  const durationMinutes = Math.max(endMinutes - startMinutes, 15);

  const top = (startMinutes / 60) * HOUR_HEIGHT_PX;
  const height = (durationMinutes / 60) * HOUR_HEIGHT_PX;

  return {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
  };
}

export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function toTimeInputValue(date: Date): string {
  return format(date, "HH:mm");
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function defaultEventEnd(start: Date): Date {
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return end;
}

export function viewLabel(view: CalendarView): string {
  switch (view) {
    case "month":
      return "Month";
    case "week":
      return "Week";
    case "day":
      return "Day";
    case "agenda":
      return "Agenda";
  }
}

export function viewShortcut(view: CalendarView): string {
  switch (view) {
    case "month":
      return "M";
    case "week":
      return "W";
    case "day":
      return "D";
    case "agenda":
      return "A";
  }
}
