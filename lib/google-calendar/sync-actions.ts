"use server";

import { fetchCalendarEventsForUser } from "@/lib/calendar/fetch-calendar-events";
import { fetchGoogleCalendarSourcesForUser } from "@/lib/google-calendar/calendar-sources";
import { getGoogleCalendarConnection } from "@/lib/google-calendar/connection";
import { syncGoogleCalendarForUser } from "@/lib/google-calendar/sync";
import { getSessionUser } from "@/lib/supabase/server";
import type { CalendarEvent, GoogleCalendarSource } from "@/types/calendar";

export type SyncGoogleCalendarResult =
  | {
      ok: true;
      pulled: number;
      pushed: number;
      deleted: number;
      events: CalendarEvent[];
      calendarSources: GoogleCalendarSource[];
      lastSyncedAt: string | null;
      googleEmail: string | null;
    }
  | { ok: false; message: string };

export type SyncGoogleCalendarInput = {
  startIso: string;
  endIso: string;
};

export async function syncGoogleCalendarAction(
  range?: SyncGoogleCalendarInput,
): Promise<SyncGoogleCalendarResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const connection = await getGoogleCalendarConnection(user.id);
  if (!connection) {
    return { ok: false, message: "Google Calendar is not connected." };
  }

  try {
    const result = await syncGoogleCalendarForUser(user.id);
    const fetchWindow = range
      ? { start: new Date(range.startIso), end: new Date(range.endIso) }
      : undefined;
    const [events, calendarSources, refreshed] = await Promise.all([
      fetchCalendarEventsForUser(fetchWindow),
      fetchGoogleCalendarSourcesForUser(),
      getGoogleCalendarConnection(user.id),
    ]);

    return {
      ok: true,
      ...result,
      events,
      calendarSources,
      lastSyncedAt: refreshed?.lastSyncedAt ?? connection.lastSyncedAt,
      googleEmail: refreshed?.googleEmail ?? connection.googleEmail,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Sync failed.",
    };
  }
}
