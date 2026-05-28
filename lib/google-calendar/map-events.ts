import {
  allDayExclusiveEndDateString,
  allDayFirstDay,
  allDayLastInclusiveDay,
  formatAllDayDateString,
} from "@/lib/calendar/all-day-events";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

const GOOGLE_PALETTE: { color: CalendarEventColor; hex: string }[] = [
  { color: "blue", hex: "#039be5" },
  { color: "green", hex: "#0b8043" },
  { color: "orange", hex: "#f4511e" },
  { color: "purple", hex: "#8e24aa" },
  { color: "red", hex: "#d50000" },
];

function hexChannel(value: string, start: number): number {
  return Number.parseInt(value.slice(start, start + 2), 16);
}

function colorDistance(a: string, b: string): number {
  const ar = hexChannel(a, 1);
  const ag = hexChannel(a, 3);
  const ab = hexChannel(a, 5);
  const br = hexChannel(b, 1);
  const bg = hexChannel(b, 3);
  const bb = hexChannel(b, 5);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

export function mapGoogleCalendarColorToKarriqi(
  hex: string | undefined,
): CalendarEventColor {
  const normalized = (hex ?? "#039be5").toLowerCase();
  if (normalized.length === 4) {
    const [, r, g, b] = normalized;
    return mapGoogleCalendarColorToKarriqi(`#${r}${r}${g}${g}${b}${b}`);
  }

  let best: CalendarEventColor = "blue";
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of GOOGLE_PALETTE) {
    const distance = colorDistance(normalized, entry.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry.color;
    }
  }

  return best;
}

export type GoogleCalendarEventItem = {
  id: string;
  etag?: string;
  status?: string;
  summary?: string;
  description?: string;
  updated?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
};

export type KarriqiEventRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: string;
  google_event_id: string | null;
  google_calendar_id: string | null;
  google_etag: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export function allDayGoogleDatesFromRow(row: {
  start_at: string;
  end_at: string;
}): { startDate: string; endDate: string } {
  const range = {
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: true,
  } as CalendarEvent;

  return {
    startDate: formatAllDayDateString(allDayFirstDay(range)),
    endDate: allDayExclusiveEndDateString(allDayLastInclusiveDay(range)),
  };
}

function isEventColor(value: string): value is CalendarEventColor {
  return (CALENDAR_EVENT_COLORS as readonly string[]).includes(value);
}

function parseGoogleDateTime(value: {
  date?: string;
  dateTime?: string;
}): { iso: string; allDay: boolean } {
  if (value.dateTime) {
    return { iso: new Date(value.dateTime).toISOString(), allDay: false };
  }
  if (value.date) {
    return { iso: `${value.date}T00:00:00.000Z`, allDay: true };
  }
  return { iso: new Date().toISOString(), allDay: false };
}

export function googleEventToKarriqiInsert(input: {
  userId: string;
  calendarId: string;
  calendarColor?: string;
  item: GoogleCalendarEventItem;
}): Omit<KarriqiEventRow, "id" | "created_at" | "updated_at"> | null {
  if (input.item.status === "cancelled") {
    return null;
  }

  const title = input.item.summary?.trim();
  if (!title) {
    return null;
  }

  if (!input.item.start || !input.item.end) {
    return null;
  }

  const start = parseGoogleDateTime(input.item.start);
  const end = parseGoogleDateTime(input.item.end);

  return {
    user_id: input.userId,
    title,
    description: input.item.description?.trim() || null,
    start_at: start.iso,
    end_at: end.iso,
    all_day: start.allDay,
    color: mapGoogleCalendarColorToKarriqi(input.calendarColor),
    google_event_id: input.item.id,
    google_calendar_id: input.calendarId,
    google_etag: input.item.etag ?? null,
    source: "google",
  };
}

export function karriqiEventToGoogleBody(row: {
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
}): Record<string, unknown> {
  if (row.all_day) {
    const { startDate, endDate } = allDayGoogleDatesFromRow(row);
    return {
      summary: row.title,
      description: row.description ?? undefined,
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  return {
    summary: row.title,
    description: row.description ?? undefined,
    start: { dateTime: new Date(row.start_at).toISOString() },
    end: { dateTime: new Date(row.end_at).toISOString() },
  };
}

export function normalizeColor(value: string): CalendarEventColor {
  return isEventColor(value) ? value : "blue";
}

export function googleUpdatedMs(item: GoogleCalendarEventItem): number {
  return item.updated ? new Date(item.updated).getTime() : 0;
}

export function rowUpdatedMs(row: KarriqiEventRow): number {
  return new Date(row.updated_at).getTime();
}
