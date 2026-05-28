import { subMonths, addMonths } from "date-fns";

import {
  getGoogleCalendarSourcesAdmin,
  isReadableGoogleCalendar,
  updateGoogleCalendarSourceSyncToken,
  upsertGoogleCalendarSourcesFromList,
} from "@/lib/google-calendar/calendar-sources";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  GoogleCalendarApiError,
  listGoogleCalendarEvents,
  listGoogleCalendarList,
  updateGoogleCalendarEvent,
} from "@/lib/google-calendar/client";
import {
  getGoogleCalendarConnection,
  getValidGoogleAccessToken,
  updateGoogleCalendarSyncState,
  type GoogleCalendarConnection,
} from "@/lib/google-calendar/connection";
import {
  googleEventToKarriqiInsert,
  googleUpdatedMs,
  karriqiEventToGoogleBody,
  rowUpdatedMs,
  type KarriqiEventRow,
} from "@/lib/google-calendar/map-events";
import { createAdminClient } from "@/lib/supabase/admin";

export type GoogleCalendarSyncResult = {
  pulled: number;
  pushed: number;
  deleted: number;
};

async function fetchLocalEvents(userId: string): Promise<KarriqiEventRow[]> {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("calendar_events")
    .select(
      "id, user_id, title, description, start_at, end_at, all_day, color, google_event_id, google_calendar_id, google_etag, source, created_at, updated_at",
    )
    .eq("user_id", userId);

  return (data ?? []) as KarriqiEventRow[];
}

async function upsertFromGoogle(input: {
  userId: string;
  calendarId: string;
  calendarColor?: string;
  items: Awaited<ReturnType<typeof listGoogleCalendarEvents>>["items"];
}): Promise<{ pulled: number; deleted: number }> {
  const admin = createAdminClient();
  if (!admin) {
    return { pulled: 0, deleted: 0 };
  }

  const existing = await fetchLocalEvents(input.userId);
  const byGoogleId = new Map(
    existing
      .filter((row) => row.google_event_id)
      .map((row) => [row.google_event_id as string, row]),
  );

  let pulled = 0;
  let deleted = 0;

  for (const item of input.items) {
    if (item.status === "cancelled" && item.id) {
      const local = byGoogleId.get(item.id);
      if (local) {
        await admin.from("calendar_events").delete().eq("id", local.id);
        deleted += 1;
      }
      continue;
    }

    const mapped = googleEventToKarriqiInsert({
      userId: input.userId,
      calendarId: input.calendarId,
      calendarColor: input.calendarColor,
      item,
    });
    if (!mapped) {
      continue;
    }

    const local = byGoogleId.get(mapped.google_event_id as string);
    const googleUpdated = googleUpdatedMs(item);

    if (local) {
      if (googleUpdated <= rowUpdatedMs(local)) {
        continue;
      }

      const { error } = await admin
        .from("calendar_events")
        .update({
          title: mapped.title,
          description: mapped.description,
          start_at: mapped.start_at,
          end_at: mapped.end_at,
          all_day: mapped.all_day,
          color: mapped.color,
          google_calendar_id: mapped.google_calendar_id,
          google_etag: mapped.google_etag,
          source: "google",
        })
        .eq("id", local.id);

      if (!error) {
        pulled += 1;
      }
      continue;
    }

    const { error } = await admin.from("calendar_events").insert(mapped);
    if (error) {
      console.error("Google calendar insert failed:", error.message, mapped.title);
    } else {
      pulled += 1;
    }
  }

  return { pulled, deleted };
}

async function pushUnsyncedLocalEvents(input: {
  connection: GoogleCalendarConnection;
  accessToken: string;
  targetCalendarId: string;
}): Promise<number> {
  const admin = createAdminClient();
  if (!admin) {
    return 0;
  }

  const rows = await fetchLocalEvents(input.connection.userId);
  let pushed = 0;

  for (const row of rows) {
    if (row.google_event_id) {
      continue;
    }

    const body = karriqiEventToGoogleBody(row);
    try {
      const created = await createGoogleCalendarEvent({
        accessToken: input.accessToken,
        calendarId: input.targetCalendarId,
        body,
      });

      await admin
        .from("calendar_events")
        .update({
          google_event_id: created.id,
          google_calendar_id: input.targetCalendarId,
          google_etag: created.etag ?? null,
          source: "local",
        })
        .eq("id", row.id);

      pushed += 1;
    } catch (err) {
      console.error("Failed to push local event to Google:", row.id, err);
    }
  }

  return pushed;
}

async function syncCalendarEvents(input: {
  userId: string;
  accessToken: string;
  calendarId: string;
  calendarColor: string;
  syncToken: string | null;
  timeMin: string;
  timeMax: string;
}): Promise<{ pulled: number; deleted: number; nextSyncToken: string | null }> {
  let items: Awaited<ReturnType<typeof listGoogleCalendarEvents>>["items"];
  let nextSyncToken: string | null = null;

  try {
    const listed = await listGoogleCalendarEvents({
      accessToken: input.accessToken,
      calendarId: input.calendarId,
      syncToken: input.syncToken,
      timeMin: input.syncToken ? undefined : input.timeMin,
      timeMax: input.syncToken ? undefined : input.timeMax,
    });
    items = listed.items;
    nextSyncToken = listed.nextSyncToken;
  } catch (err) {
    if (err instanceof GoogleCalendarApiError && err.status === 410 && input.syncToken) {
      const listed = await listGoogleCalendarEvents({
        accessToken: input.accessToken,
        calendarId: input.calendarId,
        timeMin: input.timeMin,
        timeMax: input.timeMax,
      });
      items = listed.items;
      nextSyncToken = listed.nextSyncToken;
    } else {
      throw err;
    }
  }

  const { pulled, deleted } = await upsertFromGoogle({
    userId: input.userId,
    calendarId: input.calendarId,
    calendarColor: input.calendarColor,
    items,
  });

  await updateGoogleCalendarSourceSyncToken({
    userId: input.userId,
    googleCalendarId: input.calendarId,
    syncToken: nextSyncToken ?? input.syncToken,
  });

  return { pulled, deleted, nextSyncToken };
}

export async function syncGoogleCalendarForUser(
  userId: string,
): Promise<GoogleCalendarSyncResult> {
  const connection = await getGoogleCalendarConnection(userId);
  if (!connection) {
    return { pulled: 0, pushed: 0, deleted: 0 };
  }

  const accessToken = await getValidGoogleAccessToken(connection);
  const now = new Date();
  const timeMin = subMonths(now, 3).toISOString();
  const timeMax = addMonths(now, 12).toISOString();

  const calendarList = await listGoogleCalendarList(accessToken);
  await upsertGoogleCalendarSourcesFromList({ userId, items: calendarList });

  const sources = await getGoogleCalendarSourcesAdmin(userId);
  const readableSources = sources.filter((source) =>
    isReadableGoogleCalendar(source.accessRole),
  );

  let pulled = 0;
  let deleted = 0;

  for (const source of readableSources) {
    try {
      const result = await syncCalendarEvents({
        userId,
        accessToken,
        calendarId: source.googleCalendarId,
        calendarColor: source.backgroundColor,
        syncToken: source.syncToken,
        timeMin,
        timeMax,
      });
      pulled += result.pulled;
      deleted += result.deleted;
    } catch (err) {
      console.error(
        "Failed to sync Google calendar:",
        source.googleCalendarId,
        err,
      );
    }
  }

  const pushTarget =
    readableSources.find((source) => source.primary)?.googleCalendarId ??
    connection.calendarId;

  const pushed = await pushUnsyncedLocalEvents({
    connection,
    accessToken,
    targetCalendarId: pushTarget,
  });

  await updateGoogleCalendarSyncState({
    userId,
    lastSyncedAt: new Date().toISOString(),
  });

  return { pulled, pushed, deleted };
}

export async function pushCalendarEventToGoogle(input: {
  userId: string;
  eventId: string;
}): Promise<void> {
  const connection = await getGoogleCalendarConnection(input.userId);
  if (!connection) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { data: row } = await admin
    .from("calendar_events")
    .select(
      "id, user_id, title, description, start_at, end_at, all_day, color, google_event_id, google_calendar_id, google_etag, source, created_at, updated_at",
    )
    .eq("id", input.eventId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!row) {
    return;
  }

  const event = row as KarriqiEventRow;
  const accessToken = await getValidGoogleAccessToken(connection);
  const body = karriqiEventToGoogleBody(event);
  const calendarId =
    event.google_calendar_id ?? connection.calendarId ?? "primary";

  if (event.google_event_id) {
    const updated = await updateGoogleCalendarEvent({
      accessToken,
      calendarId,
      eventId: event.google_event_id,
      body,
    });

    await admin
      .from("calendar_events")
      .update({
        google_etag: updated.etag ?? null,
        google_calendar_id: calendarId,
      })
      .eq("id", event.id);
    return;
  }

  const created = await createGoogleCalendarEvent({
    accessToken,
    calendarId,
    body,
  });

  await admin
    .from("calendar_events")
    .update({
      google_event_id: created.id,
      google_calendar_id: calendarId,
      google_etag: created.etag ?? null,
      source: "local",
    })
    .eq("id", event.id);
}

export async function deleteCalendarEventFromGoogle(input: {
  userId: string;
  googleEventId: string;
  calendarId?: string | null;
}): Promise<void> {
  const connection = await getGoogleCalendarConnection(input.userId);
  if (!connection) {
    return;
  }

  const accessToken = await getValidGoogleAccessToken(connection);
  const calendarId =
    input.calendarId ?? connection.calendarId ?? "primary";

  try {
    await deleteGoogleCalendarEvent({
      accessToken,
      calendarId,
      eventId: input.googleEventId,
    });
  } catch (err) {
    if (err instanceof GoogleCalendarApiError && err.status === 404) {
      return;
    }
    throw err;
  }
}
