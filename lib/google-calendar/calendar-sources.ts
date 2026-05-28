import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { GoogleCalendarSource } from "@/types/calendar";

export type GoogleCalendarListItem = {
  id: string;
  summary?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
  accessRole?: string;
};

type SourceRow = {
  user_id: string;
  google_calendar_id: string;
  summary: string;
  background_color: string;
  foreground_color: string | null;
  selected: boolean;
  primary_calendar: boolean;
  access_role: string | null;
  sync_token: string | null;
  last_synced_at: string | null;
};

const READABLE_ACCESS_ROLES = new Set(["owner", "writer", "reader"]);

export function isReadableGoogleCalendar(role: string | null | undefined): boolean {
  if (!role) {
    return true;
  }
  return READABLE_ACCESS_ROLES.has(role);
}

function mapRow(row: SourceRow): GoogleCalendarSource {
  return {
    googleCalendarId: row.google_calendar_id,
    summary: row.summary,
    backgroundColor: row.background_color,
    foregroundColor: row.foreground_color,
    selected: row.selected,
    primary: row.primary_calendar,
    accessRole: row.access_role,
  };
}

export async function fetchGoogleCalendarSourcesForUser(): Promise<
  GoogleCalendarSource[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_calendar_sources")
    .select(
      "google_calendar_id, summary, background_color, foreground_color, selected, primary_calendar, access_role",
    )
    .order("primary_calendar", { ascending: false })
    .order("summary", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapRow({
      ...(row as Omit<SourceRow, "user_id" | "sync_token" | "last_synced_at">),
      user_id: "",
      sync_token: null,
      last_synced_at: null,
    }),
  );
}

export async function getGoogleCalendarSourcesAdmin(
  userId: string,
): Promise<(GoogleCalendarSource & { syncToken: string | null })[]> {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("google_calendar_sources")
    .select(
      "google_calendar_id, summary, background_color, foreground_color, selected, primary_calendar, access_role, sync_token",
    )
    .eq("user_id", userId)
    .order("primary_calendar", { ascending: false })
    .order("summary", { ascending: true });

  return (data ?? []).map((row) => ({
    ...mapRow({
      ...(row as SourceRow),
      user_id: userId,
      last_synced_at: null,
    }),
    syncToken: (row as SourceRow).sync_token,
  }));
}

export async function upsertGoogleCalendarSourcesFromList(input: {
  userId: string;
  items: GoogleCalendarListItem[];
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role is not configured.");
  }

  const existing = await getGoogleCalendarSourcesAdmin(input.userId);
  const existingById = new Map(
    existing.map((item) => [item.googleCalendarId, item]),
  );

  for (const item of input.items) {
    if (!item.id || !item.summary) {
      continue;
    }

    const prior = existingById.get(item.id);

    await admin.from("google_calendar_sources").upsert(
      {
        user_id: input.userId,
        google_calendar_id: item.id,
        summary: item.summary,
        background_color: item.backgroundColor ?? "#039be5",
        foreground_color: item.foregroundColor ?? null,
        selected: prior?.selected ?? item.selected ?? true,
        primary_calendar: item.primary ?? false,
        access_role: item.accessRole ?? null,
        sync_token: prior?.syncToken ?? null,
      },
      { onConflict: "user_id,google_calendar_id" },
    );
  }
}

export async function updateGoogleCalendarSourceSyncToken(input: {
  userId: string;
  googleCalendarId: string;
  syncToken: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role is not configured.");
  }

  await admin
    .from("google_calendar_sources")
    .update({
      sync_token: input.syncToken,
      last_synced_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .eq("google_calendar_id", input.googleCalendarId);
}

export async function setGoogleCalendarSourceSelected(input: {
  userId: string;
  googleCalendarId: string;
  selected: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("google_calendar_sources")
    .update({ selected: input.selected })
    .eq("google_calendar_id", input.googleCalendarId);

  if (error) {
    throw new Error(error.message);
  }
}
