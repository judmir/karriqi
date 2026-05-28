import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

import type { CalendarEvent } from "@/types/calendar";

export function parseEventDate(iso: string): Date {
  return parseISO(iso);
}

/** Parse an all-day ISO value as a local calendar date (date portion only). */
export function parseAllDayCalendarDate(iso: string): Date {
  const datePart = iso.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) {
    return startOfDay(parseISO(iso));
  }
  return new Date(year, month - 1, day);
}

/** Format a local calendar date as YYYY-MM-DD (Google Calendar date fields). */
export function formatAllDayDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Store an all-day calendar date in DB/API ISO form without timezone drift. */
export function calendarDateToStorage(date: Date): string {
  return `${formatAllDayDateString(date)}T00:00:00.000Z`;
}

/** First calendar day for an all-day event (local). */
export function allDayFirstDay(event: CalendarEvent): Date {
  return parseAllDayCalendarDate(event.startAt);
}

/**
 * Last inclusive calendar day for an all-day event.
 * Stored end dates use Google’s exclusive convention (midnight on the day after).
 */
export function allDayLastInclusiveDay(event: CalendarEvent): Date {
  const startDay = allDayFirstDay(event);
  const endDay = parseAllDayCalendarDate(event.endAt);

  if (endDay > startDay) {
    return subDays(endDay, 1);
  }

  return endDay;
}

export function isMultiDayAllDayEvent(event: CalendarEvent): boolean {
  if (!event.allDay) {
    return false;
  }
  return !isSameDay(allDayFirstDay(event), allDayLastInclusiveDay(event));
}

export function eventSpansDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  if (event.allDay) {
    const first = allDayFirstDay(event);
    const last = allDayLastInclusiveDay(event);
    return dayStart <= last && dayEnd >= first;
  }

  const start = parseEventDate(event.startAt);
  const end = parseEventDate(event.endAt);
  return start <= dayEnd && end >= dayStart;
}

/** Exclusive end date string (YYYY-MM-DD) for Google Calendar API. */
export function allDayExclusiveEndDateString(inclusiveEnd: Date): string {
  return formatAllDayDateString(addDays(inclusiveEnd, 1));
}

/** End date to show in the all-day event form (inclusive). */
export function allDayInclusiveEndForForm(event: CalendarEvent): Date {
  return allDayLastInclusiveDay(event);
}

export function allDayDayCount(event: CalendarEvent): number {
  const first = allDayFirstDay(event);
  const last = allDayLastInclusiveDay(event);
  return (
    Math.round((last.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
}

export type MonthEventSegment = {
  event: CalendarEvent;
  weekIndex: number;
  startCol: number;
  span: number;
  lane: number;
  showTitle: boolean;
  continuesFromPriorWeek: boolean;
  continuesToNextWeek: boolean;
};

export function monthGridWeeks(gridDays: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < gridDays.length; i += 7) {
    weeks.push(gridDays.slice(i, i + 7));
  }
  return weeks;
}

export function layoutMonthMultiDaySegments(
  events: CalendarEvent[],
  weeks: Date[][],
): MonthEventSegment[] {
  const multiDay = events.filter(isMultiDayAllDayEvent);
  const segments: MonthEventSegment[] = [];

  weeks.forEach((weekDays, weekIndex) => {
    const weekStart = startOfDay(weekDays[0]!);
    const weekEnd = endOfDay(weekDays[6]!);
    const laneEnds: number[] = [];

    const weekEvents = multiDay
      .filter((event) => {
        const first = allDayFirstDay(event);
        const last = allDayLastInclusiveDay(event);
        return first <= weekEnd && last >= weekStart;
      })
      .sort((a, b) => {
        const aFirst = allDayFirstDay(a);
        const bFirst = allDayFirstDay(b);
        const aDays = allDayDayCount(a);
        const bDays = allDayDayCount(b);
        if (bDays !== aDays) {
          return bDays - aDays;
        }
        return aFirst.getTime() - bFirst.getTime();
      });

    for (const event of weekEvents) {
      let startCol = -1;
      let endCol = -1;

      for (let col = 0; col < 7; col++) {
        if (eventSpansDay(event, weekDays[col]!)) {
          if (startCol === -1) {
            startCol = col;
          }
          endCol = col;
        }
      }

      if (startCol === -1 || endCol === -1) {
        continue;
      }

      const span = endCol - startCol + 1;
      let lane = 0;
      while (laneEnds[lane] !== undefined && laneEnds[lane]! >= startCol) {
        lane += 1;
      }
      laneEnds[lane] = startCol + span - 1;

      const eventStart = allDayFirstDay(event);
      const eventEnd = allDayLastInclusiveDay(event);
      const segmentStartDay = weekDays[startCol]!;
      const segmentEndDay = weekDays[endCol]!;
      const showTitle = isSameDay(eventStart, segmentStartDay);
      const continuesFromPriorWeek = eventStart < startOfDay(segmentStartDay);
      const continuesToNextWeek = eventEnd > startOfDay(segmentEndDay);

      segments.push({
        event,
        weekIndex,
        startCol,
        span,
        lane,
        showTitle,
        continuesFromPriorWeek,
        continuesToNextWeek,
      });
    }
  });

  return segments;
}

export function maxSegmentLane(
  segments: MonthEventSegment[],
  weekIndex: number,
): number {
  const lanes = segments
    .filter((segment) => segment.weekIndex === weekIndex)
    .map((segment) => segment.lane);
  return lanes.length === 0 ? -1 : Math.max(...lanes);
}
