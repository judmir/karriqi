import { GOOGLE_CALENDAR_API_BASE } from "@/lib/google-calendar/constants";
import type { GoogleCalendarListItem } from "@/lib/google-calendar/calendar-sources";
import type { GoogleCalendarEventItem } from "@/lib/google-calendar/map-events";

type ListEventsResponse = {
  items?: GoogleCalendarEventItem[];
  nextSyncToken?: string;
  nextPageToken?: string;
};

export class GoogleCalendarApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function googleCalendarFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${GOOGLE_CALENDAR_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new GoogleCalendarApiError(
      data.error?.message ?? `Google Calendar API error (${res.status})`,
      res.status,
    );
  }

  return data;
}

export async function listGoogleCalendarList(
  accessToken: string,
): Promise<GoogleCalendarListItem[]> {
  type ListResponse = {
    items?: GoogleCalendarListItem[];
    nextPageToken?: string;
  };

  const items: GoogleCalendarListItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ minAccessRole: "reader" });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const data = await googleCalendarFetch<ListResponse>(
      accessToken,
      `/users/me/calendarList?${params.toString()}`,
    );

    if (data.items?.length) {
      items.push(...data.items);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

export async function fetchGooglePrimaryEmail(
  accessToken: string,
): Promise<string | null> {
  const data = await googleCalendarFetch<{ email?: string }>(
    accessToken,
    "/users/me/calendarList/primary",
  );
  return data.email ?? null;
}

export async function listGoogleCalendarEvents(input: {
  accessToken: string;
  calendarId: string;
  syncToken?: string | null;
  timeMin?: string;
  timeMax?: string;
}): Promise<{ items: GoogleCalendarEventItem[]; nextSyncToken: string | null }> {
  const items: GoogleCalendarEventItem[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      showDeleted: "true",
    });

    if (input.syncToken) {
      params.set("syncToken", input.syncToken);
    } else {
      params.set("orderBy", "startTime");
      if (input.timeMin) {
        params.set("timeMin", input.timeMin);
      }
      if (input.timeMax) {
        params.set("timeMax", input.timeMax);
      }
    }

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const data = await googleCalendarFetch<ListEventsResponse>(
      input.accessToken,
      `/calendars/${encodeURIComponent(input.calendarId)}/events?${params.toString()}`,
    );

    if (data.items?.length) {
      items.push(...data.items);
    }

    pageToken = data.nextPageToken;
    if (data.nextSyncToken) {
      nextSyncToken = data.nextSyncToken;
    }
  } while (pageToken);

  return { items, nextSyncToken };
}

export async function createGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  body: Record<string, unknown>;
}): Promise<GoogleCalendarEventItem> {
  return googleCalendarFetch<GoogleCalendarEventItem>(
    input.accessToken,
    `/calendars/${encodeURIComponent(input.calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify(input.body),
    },
  );
}

export async function updateGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  body: Record<string, unknown>;
}): Promise<GoogleCalendarEventItem> {
  return googleCalendarFetch<GoogleCalendarEventItem>(
    input.accessToken,
    `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    {
      method: "PUT",
      body: JSON.stringify(input.body),
    },
  );
}

export async function deleteGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  await googleCalendarFetch<void>(
    input.accessToken,
    `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    { method: "DELETE" },
  );
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}
