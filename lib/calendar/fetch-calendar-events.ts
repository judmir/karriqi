import { addMonths, subMonths } from "date-fns";

import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

/**
 * Default fetch window. Matches the Google sync window (see
 * `lib/google-calendar/sync.ts`) so the UI never misses synced events while
 * avoiding an unbounded full-table read on every load.
 */
export const CALENDAR_FETCH_MONTHS_BACK = 3;
export const CALENDAR_FETCH_MONTHS_FORWARD = 12;

type EventRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: string;
  google_calendar_id: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

function isEventColor(value: string): value is CalendarEventColor {
  return (CALENDAR_EVENT_COLORS as readonly string[]).includes(value);
}

function mapEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    color: isEventColor(row.color) ? row.color : "blue",
    googleCalendarId: row.google_calendar_id,
    source:
      row.source === "google" || row.source === "local" ? row.source : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCalendarEventsForUser(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const now = new Date();
  const windowStart = subMonths(now, CALENDAR_FETCH_MONTHS_BACK).toISOString();
  const windowEnd = addMonths(now, CALENDAR_FETCH_MONTHS_FORWARD).toISOString();

  const { data, error } = await withoutSoftDeleted(
    supabase.from("calendar_events").select(
      "id, user_id, title, description, start_at, end_at, all_day, color, google_calendar_id, source, created_at, updated_at",
    ),
  )
    // Overlap check: event ends after window start and starts before window end.
    .gte("end_at", windowStart)
    .lte("start_at", windowEnd)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEvent(row as EventRow));
}
