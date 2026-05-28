import { createAdminClient } from "@/lib/supabase/admin";
import { refreshGoogleAccessToken } from "@/lib/google-calendar/oauth";
import type { Database } from "@/types/database";

type ConnectionUpdate =
  Database["public"]["Tables"]["google_calendar_connections"]["Update"];

export type GoogleCalendarConnection = {
  userId: string;
  googleEmail: string | null;
  calendarId: string;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  syncToken: string | null;
  lastSyncedAt: string | null;
};

type ConnectionRow = {
  user_id: string;
  google_email: string | null;
  calendar_id: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  sync_token: string | null;
  last_synced_at: string | null;
};

function mapRow(row: ConnectionRow): GoogleCalendarConnection {
  return {
    userId: row.user_id,
    googleEmail: row.google_email,
    calendarId: row.calendar_id,
    refreshToken: row.refresh_token,
    accessToken: row.access_token,
    accessTokenExpiresAt: row.access_token_expires_at,
    syncToken: row.sync_token,
    lastSyncedAt: row.last_synced_at,
  };
}

export async function getGoogleCalendarConnection(
  userId: string,
): Promise<GoogleCalendarConnection | null> {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("google_calendar_connections")
    .select(
      "user_id, google_email, calendar_id, refresh_token, access_token, access_token_expires_at, sync_token, last_synced_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as ConnectionRow);
}

export async function upsertGoogleCalendarConnection(input: {
  userId: string;
  googleEmail?: string | null;
  calendarId?: string;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role is not configured.");
  }

  const { error } = await admin.from("google_calendar_connections").upsert(
    {
      user_id: input.userId,
      google_email: input.googleEmail ?? null,
      calendar_id: input.calendarId ?? "primary",
      refresh_token: input.refreshToken,
      access_token: input.accessToken,
      access_token_expires_at: input.accessTokenExpiresAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateGoogleCalendarConnectionTokens(input: {
  userId: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken?: string;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role is not configured.");
  }

  const patch: ConnectionUpdate = {
    access_token: input.accessToken,
    access_token_expires_at: input.accessTokenExpiresAt,
  };
  if (input.refreshToken) {
    patch.refresh_token = input.refreshToken;
  }

  const { error } = await admin
    .from("google_calendar_connections")
    .update(patch)
    .eq("user_id", input.userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateGoogleCalendarSyncState(input: {
  userId: string;
  syncToken?: string | null;
  lastSyncedAt?: string;
  googleEmail?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role is not configured.");
  }

  const patch: ConnectionUpdate = {};
  if (input.syncToken !== undefined) {
    patch.sync_token = input.syncToken;
  }
  if (input.lastSyncedAt) {
    patch.last_synced_at = input.lastSyncedAt;
  }
  if (input.googleEmail !== undefined) {
    patch.google_email = input.googleEmail;
  }

  const { error } = await admin
    .from("google_calendar_connections")
    .update(patch)
    .eq("user_id", input.userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteGoogleCalendarConnection(
  userId: string,
): Promise<GoogleCalendarConnection | null> {
  const existing = await getGoogleCalendarConnection(userId);
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role is not configured.");
  }

  const { error } = await admin
    .from("google_calendar_connections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return existing;
}

export async function getValidGoogleAccessToken(
  connection: GoogleCalendarConnection,
): Promise<string> {
  const expiresAt = connection.accessTokenExpiresAt
    ? new Date(connection.accessTokenExpiresAt).getTime()
    : 0;
  const stillValid = connection.accessToken && expiresAt - Date.now() > 60_000;

  if (stillValid && connection.accessToken) {
    return connection.accessToken;
  }

  const refreshed = await refreshGoogleAccessToken(connection.refreshToken);
  const accessTokenExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();

  await updateGoogleCalendarConnectionTokens({
    userId: connection.userId,
    accessToken: refreshed.access_token,
    accessTokenExpiresAt,
    refreshToken: refreshed.refresh_token,
  });

  return refreshed.access_token;
}
