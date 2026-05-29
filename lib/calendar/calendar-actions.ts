"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import {
  CALENDAR_READONLY_MESSAGE,
  isCalendarReadOnly,
} from "@/lib/calendar/calendar-readonly";
import {
  deleteCalendarEventFromGoogle,
  pushCalendarEventToGoogle,
} from "@/lib/google-calendar/sync";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

type CalendarEventUpdate =
  Database["public"]["Tables"]["calendar_events"]["Update"];

type Err = { ok: false; message: string };

function ok<T extends { ok: true }>(x: T): T {
  revalidatePath(ROUTES.calendar);
  return x;
}

function isEventColor(value: string | undefined): value is CalendarEventColor {
  return Boolean(
    value && (CALENDAR_EVENT_COLORS as readonly string[]).includes(value),
  );
}

export type CreateCalendarEventResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createCalendarEvent(input: {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
}): Promise<CreateCalendarEventResult> {
  if (isCalendarReadOnly()) {
    return { ok: false, message: CALENDAR_READONLY_MESSAGE };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { ok: false, message: "Invalid date or time." };
  }
  if (endAt < startAt) {
    return { ok: false, message: "End must be after start." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: created, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title,
      description: input.description?.trim() || null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: input.allDay ?? false,
      color: isEventColor(input.color) ? input.color : "blue",
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, message: error?.message ?? "Insert failed." };
  }

  try {
    await pushCalendarEventToGoogle({ userId: user.id, eventId: created.id });
  } catch (pushErr) {
    console.error("Google Calendar push after create failed:", pushErr);
  }

  return ok({ ok: true, id: created.id });
}

export type UpdateCalendarEventResult = { ok: true } | Err;

export async function updateCalendarEvent(input: {
  id: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  color?: CalendarEventColor;
}): Promise<UpdateCalendarEventResult> {
  if (isCalendarReadOnly()) {
    return { ok: false, message: CALENDAR_READONLY_MESSAGE };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const patch: CalendarEventUpdate = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      return { ok: false, message: "Title is required." };
    }
    patch.title = title;
  }

  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }

  if (input.startAt !== undefined) {
    const startAt = new Date(input.startAt);
    if (Number.isNaN(startAt.getTime())) {
      return { ok: false, message: "Invalid start date." };
    }
    patch.start_at = startAt.toISOString();
  }

  if (input.endAt !== undefined) {
    const endAt = new Date(input.endAt);
    if (Number.isNaN(endAt.getTime())) {
      return { ok: false, message: "Invalid end date." };
    }
    patch.end_at = endAt.toISOString();
  }

  if (input.allDay !== undefined) {
    patch.all_day = input.allDay;
  }

  if (input.color !== undefined && isEventColor(input.color)) {
    patch.color = input.color;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "Nothing to update." };
  }

  const { error } = await supabase
    .from("calendar_events")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  try {
    await pushCalendarEventToGoogle({ userId: user.id, eventId: input.id });
  } catch (pushErr) {
    console.error("Google Calendar push after update failed:", pushErr);
  }

  return ok({ ok: true });
}

export type DeleteCalendarEventResult = { ok: true } | Err;

export async function deleteCalendarEvent(
  id: string,
): Promise<DeleteCalendarEventResult> {
  if (isCalendarReadOnly()) {
    return { ok: false, message: CALENDAR_READONLY_MESSAGE };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: existing } = await supabase
    .from("calendar_events")
    .select("google_event_id, google_calendar_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (existing?.google_event_id) {
    try {
      await deleteCalendarEventFromGoogle({
        userId: user.id,
        googleEventId: existing.google_event_id,
        calendarId: existing.google_calendar_id,
      });
    } catch (pushErr) {
      console.error("Google Calendar delete failed:", pushErr);
    }
  }

  return ok({ ok: true });
}
