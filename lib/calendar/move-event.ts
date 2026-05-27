import {
  addDays,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

import { parseEventDate } from "@/lib/calendar/calendar-utils";
import type { CalendarEvent } from "@/types/calendar";

function eventDurationMs(event: CalendarEvent): number {
  return (
    parseEventDate(event.endAt).getTime() -
    parseEventDate(event.startAt).getTime()
  );
}

function withUpdatedRange(
  event: CalendarEvent,
  start: Date,
  end: Date,
  allDay = event.allDay,
): CalendarEvent {
  return {
    ...event,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    allDay,
    updatedAt: new Date().toISOString(),
  };
}

/** Move an event to a new calendar day, preserving clock time and duration. */
export function moveEventToDay(
  event: CalendarEvent,
  targetDay: Date,
): CalendarEvent {
  const start = parseEventDate(event.startAt);
  const end = parseEventDate(event.endAt);
  const durationMs = eventDurationMs(event);

  if (event.allDay) {
    const dayStart = startOfDay(targetDay);
    const daySpan = Math.max(
      1,
      Math.round(
        (startOfDay(end).getTime() - startOfDay(start).getTime()) /
          (24 * 60 * 60 * 1000),
      ) + 1,
    );
    const newEnd = addDays(dayStart, daySpan - 1);
    newEnd.setHours(23, 59, 59, 999);
    return withUpdatedRange(event, dayStart, newEnd, true);
  }

  const nextStart = setMinutes(
    setHours(startOfDay(targetDay), start.getHours()),
    start.getMinutes(),
  );
  return withUpdatedRange(
    event,
    nextStart,
    new Date(nextStart.getTime() + durationMs),
    false,
  );
}

/** Snap a timed event to a time slot on a given day. */
export function moveEventToTimeSlot(
  event: CalendarEvent,
  targetDay: Date,
  hour: number,
  allDay = false,
): CalendarEvent {
  if (allDay) {
    const dayStart = startOfDay(targetDay);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    return withUpdatedRange(event, dayStart, dayEnd, true);
  }

  const durationMs = Math.max(eventDurationMs(event), 15 * 60 * 1000);
  const nextStart = setMinutes(setHours(startOfDay(targetDay), hour), 0);
  const nextEnd = new Date(nextStart.getTime() + durationMs);

  return withUpdatedRange(event, nextStart, nextEnd, false);
}
