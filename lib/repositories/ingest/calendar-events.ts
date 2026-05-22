import type { SupabaseClient } from "@supabase/supabase-js";

import type { IngestResult } from "@/lib/ingest/http";
import { isUuid } from "@/lib/shopping/is-uuid";
import type {
  CalendarEventIngest,
  CalendarEventsIngestBody,
} from "@/modules/ingest/schemas/calendar-events";
import type { Database } from "@/types/database";
import type { CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

function resolveColor(value: string | undefined): CalendarEventColor {
  if (value && (CALENDAR_EVENT_COLORS as readonly string[]).includes(value)) {
    return value as CalendarEventColor;
  }
  return "blue";
}

async function ingestOneEvent(
  admin: SupabaseClient<Database>,
  userId: string,
  event: CalendarEventIngest,
): Promise<IngestResult> {
  if (event.id && isUuid(event.id)) {
    const { data: existing, error: readError } = await admin
      .from("calendar_events")
      .select("id")
      .eq("id", event.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      throw new Error(readError.message);
    }

    if (existing) {
      const patch: Database["public"]["Tables"]["calendar_events"]["Update"] = {
        title: event.title.trim(),
        description: event.description?.trim() || null,
        start_at: new Date(event.startAt).toISOString(),
        end_at: new Date(event.endAt).toISOString(),
        all_day: event.allDay ?? false,
        color: resolveColor(event.color),
      };

      const { error } = await admin
        .from("calendar_events")
        .update(patch)
        .eq("id", event.id)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      return { id: event.id, action: "updated" };
    }
  }

  const id = event.id && isUuid(event.id) ? event.id : crypto.randomUUID();

  const { error } = await admin.from("calendar_events").insert({
    id,
    user_id: userId,
    title: event.title.trim(),
    description: event.description?.trim() || null,
    start_at: new Date(event.startAt).toISOString(),
    end_at: new Date(event.endAt).toISOString(),
    all_day: event.allDay ?? false,
    color: resolveColor(event.color),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id, action: "created" };
}

export async function ingestCalendarEvents(
  admin: SupabaseClient<Database>,
  body: CalendarEventsIngestBody,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const event of body.events) {
    results.push(await ingestOneEvent(admin, body.userId, event));
  }
  return results;
}
