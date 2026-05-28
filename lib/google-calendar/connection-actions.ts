"use server";

import { isGoogleCalendarConfigured } from "@/lib/env/google-calendar";
import { getGoogleCalendarConnection } from "@/lib/google-calendar/connection";

export type GoogleCalendarConnectionStatus = {
  configured: boolean;
  connected: boolean;
  googleEmail: string | null;
  lastSyncedAt: string | null;
};

export async function getGoogleCalendarConnectionStatus(
  userId: string,
): Promise<GoogleCalendarConnectionStatus> {
  const configured = isGoogleCalendarConfigured();
  const connection = configured
    ? await getGoogleCalendarConnection(userId)
    : null;

  return {
    configured,
    connected: Boolean(connection),
    googleEmail: connection?.googleEmail ?? null,
    lastSyncedAt: connection?.lastSyncedAt ?? null,
  };
}
