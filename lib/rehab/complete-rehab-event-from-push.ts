import {
  toggleRehabPlanEventCompleted,
  upsertRehabOccurrenceOverride,
} from "@/lib/rehab/rehab-plan-actions";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";
import { REHAB_EVENT_KINDS, type RehabEventKind } from "@/types/rehab";

type Result = { ok: true } | { ok: false; message: string };

function isEventColor(value: string | null | undefined): value is CalendarEventColor {
  return Boolean(
    value && (CALENDAR_EVENT_COLORS as readonly string[]).includes(value),
  );
}

function eventKindOrCustom(value: string | null | undefined): RehabEventKind {
  return value && (REHAB_EVENT_KINDS as readonly string[]).includes(value)
    ? (value as RehabEventKind)
    : "custom";
}

/**
 * Mark a rehab plan event complete from a push notification action.
 * Handles standalone rows, per-occurrence overrides, and recurring masters.
 */
export async function completeRehabEventFromPush(input: {
  eventId: string;
  occurrenceAt?: string | null;
}): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: event, error } = await supabase
    .from("rehab_plan_events")
    .select(
      "id, user_id, title, description, start_at, end_at, all_day, color, event_kind, series_id, recurrence_rule",
    )
    .eq("id", input.eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !event) {
    return { ok: false, message: error?.message ?? "Event not found." };
  }

  if (event.recurrence_rule) {
    const occurrenceAt = input.occurrenceAt?.trim();
    if (!occurrenceAt) {
      return { ok: false, message: "Missing occurrence time." };
    }

    const recurrenceStart = new Date(occurrenceAt);
    if (Number.isNaN(recurrenceStart.getTime())) {
      return { ok: false, message: "Invalid occurrence time." };
    }

    const masterStart = new Date(event.start_at);
    const masterEnd = new Date(event.end_at);
    const durationMs = masterEnd.getTime() - masterStart.getTime();
    const occurrenceEnd = new Date(
      recurrenceStart.getTime() + (Number.isFinite(durationMs) ? durationMs : 0),
    );

    return upsertRehabOccurrenceOverride({
      seriesId: event.series_id ?? event.id,
      recurrenceAt: recurrenceStart.toISOString(),
      title: event.title?.trim() || "Untitled",
      description: event.description,
      startAt: recurrenceStart.toISOString(),
      endAt: occurrenceEnd.toISOString(),
      allDay: event.all_day ?? false,
      color: isEventColor(event.color) ? event.color : "blue",
      eventKind: eventKindOrCustom(event.event_kind),
      completedAt: new Date().toISOString(),
    });
  }

  return toggleRehabPlanEventCompleted({ id: event.id, completed: true });
}
