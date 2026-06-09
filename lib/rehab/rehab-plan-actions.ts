"use server";

import { createClient } from "@/lib/supabase/server";
import {
  serializeRecurrenceRule,
  type RecurrenceRule,
} from "@/lib/rehab/recurrence";
import type { Database } from "@/types/database";
import type { CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";
import {
  REHAB_EVENT_KINDS,
  type RehabEventKind,
  type RehabSpeechRecording,
} from "@/types/rehab";

type RehabPlanEventUpdate =
  Database["public"]["Tables"]["rehab_plan_events"]["Update"];
type RehabSpeechRecordingRow =
  Database["public"]["Tables"]["rehab_speech_recordings"]["Row"];

type Err = { ok: false; message: string };

function ok<T extends { ok: true }>(x: T): T {
  return x;
}

function isEventColor(value: string | undefined): value is CalendarEventColor {
  return Boolean(
    value && (CALENDAR_EVENT_COLORS as readonly string[]).includes(value),
  );
}

function eventKindOrCustom(value: string | undefined): RehabEventKind {
  return value && (REHAB_EVENT_KINDS as readonly string[]).includes(value)
    ? (value as RehabEventKind)
    : "custom";
}

function mapSpeechRecording(
  row: RehabSpeechRecordingRow,
): RehabSpeechRecording {
  return {
    id: row.id,
    eventId: row.rehab_plan_event_id,
    userId: row.user_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    durationSeconds:
      row.duration_seconds === null ? null : Number(row.duration_seconds),
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

export type CreateRehabPlanEventResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createRehabPlanEvent(input: {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
  recurrence?: RecurrenceRule | null;
}): Promise<CreateRehabPlanEventResult> {
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

  const recurrenceRule = serializeRecurrenceRule(input.recurrence ?? null);

  const { data: created, error } = await supabase
    .from("rehab_plan_events")
    .insert({
      user_id: user.id,
      title,
      description: input.description?.trim() || null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: input.allDay ?? false,
      color: isEventColor(input.color) ? input.color : "blue",
      recurrence_rule: recurrenceRule,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, message: error?.message ?? "Insert failed." };
  }

  // A recurring master groups its overrides via series_id = its own id.
  if (recurrenceRule) {
    const { error: seriesError } = await supabase
      .from("rehab_plan_events")
      .update({ series_id: created.id })
      .eq("id", created.id)
      .eq("user_id", user.id);
    if (seriesError) {
      return { ok: false, message: seriesError.message };
    }
  }

  return ok({ ok: true, id: created.id });
}

export type UpdateRehabPlanEventResult = { ok: true } | Err;

export async function updateRehabPlanEvent(input: {
  id: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  color?: CalendarEventColor;
  recurrence?: RecurrenceRule | null;
}): Promise<UpdateRehabPlanEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const patch: RehabPlanEventUpdate = {};

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

  if (input.recurrence !== undefined) {
    patch.recurrence_rule = serializeRecurrenceRule(input.recurrence);
    // A plain event converting to recurring becomes its own series master.
    if (input.recurrence) {
      patch.series_id = input.id;
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "Nothing to update." };
  }

  const { error } = await supabase
    .from("rehab_plan_events")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok({ ok: true });
}

export type DeleteRehabPlanEventResult = { ok: true } | Err;

export async function deleteRehabPlanEvent(
  id: string,
): Promise<DeleteRehabPlanEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("rehab_plan_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok({ ok: true });
}

export type CompleteRehabSpeechRecordingUploadResult =
  | { ok: true; recording: RehabSpeechRecording }
  | Err;

export async function completeRehabSpeechRecordingUpload(input: {
  eventId: string;
  storagePath: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
}): Promise<CompleteRehabSpeechRecordingUploadResult> {
  const fileName = input.fileName.trim();
  const storagePath = input.storagePath.trim();
  if (!fileName || !storagePath) {
    return { ok: false, message: "Recording file is missing." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  if (!storagePath.startsWith(`${user.id}/${input.eventId}/`)) {
    return { ok: false, message: "Invalid recording path." };
  }

  const { data: event, error: eventError } = await supabase
    .from("rehab_plan_events")
    .select("id, event_kind")
    .eq("id", input.eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (eventError || !event) {
    return { ok: false, message: eventError?.message ?? "Event not found." };
  }
  if (event.event_kind !== "speech") {
    return {
      ok: false,
      message: "Recordings can only be added to speech events.",
    };
  }

  const { data: recording, error } = await supabase
    .from("rehab_speech_recordings")
    .insert({
      rehab_plan_event_id: input.eventId,
      user_id: user.id,
      file_name: fileName,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      duration_seconds: input.durationSeconds ?? null,
      storage_path: storagePath,
    })
    .select(
      "id, rehab_plan_event_id, user_id, file_name, mime_type, size_bytes, duration_seconds, storage_path, created_at",
    )
    .single();

  if (error || !recording) {
    return { ok: false, message: error?.message ?? "Recording save failed." };
  }

  return ok({ ok: true, recording: mapSpeechRecording(recording) });
}

export type DeleteRehabSpeechRecordingResult = { ok: true } | Err;

export async function deleteRehabSpeechRecording(input: {
  id: string;
}): Promise<DeleteRehabSpeechRecordingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: recording, error: findError } = await supabase
    .from("rehab_speech_recordings")
    .select("id, storage_path")
    .eq("id", input.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError || !recording) {
    return { ok: false, message: findError?.message ?? "Recording not found." };
  }

  const { error: storageError } = await supabase.storage
    .from("rehab-speech-recordings")
    .remove([recording.storage_path]);
  if (storageError) {
    return { ok: false, message: storageError.message };
  }

  const { error } = await supabase
    .from("rehab_speech_recordings")
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok({ ok: true });
}

export type ToggleRehabPlanEventCompletedResult = { ok: true } | Err;

export async function toggleRehabPlanEventCompleted(input: {
  id: string;
  completed: boolean;
}): Promise<ToggleRehabPlanEventCompletedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("rehab_plan_events")
    .update({
      completed_at: input.completed ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok({ ok: true });
}

export type UpsertRehabOccurrenceResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

/**
 * Create or update a per-occurrence override row for a recurring series.
 * Identified by (series_id, recurrence_at). Used for editing, completing, or
 * cancelling (skipping) a single occurrence.
 */
export async function upsertRehabOccurrenceOverride(input: {
  seriesId: string;
  recurrenceAt: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
  eventKind?: string;
  completedAt?: string | null;
  cancelled?: boolean;
}): Promise<UpsertRehabOccurrenceResult> {
  const recurrenceAt = new Date(input.recurrenceAt);
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (
    Number.isNaN(recurrenceAt.getTime()) ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime())
  ) {
    return { ok: false, message: "Invalid date or time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const row = {
    user_id: user.id,
    title: input.title.trim() || "Untitled",
    description: input.description?.trim() || null,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    all_day: input.allDay ?? false,
    color: isEventColor(input.color) ? input.color : "blue",
    event_kind: eventKindOrCustom(input.eventKind),
    series_id: input.seriesId,
    recurrence_at: recurrenceAt.toISOString(),
    recurrence_cancelled: input.cancelled ?? false,
    completed_at: input.completedAt ?? null,
  };

  const { data: existing, error: findError } = await supabase
    .from("rehab_plan_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("series_id", input.seriesId)
    .eq("recurrence_at", recurrenceAt.toISOString())
    .maybeSingle();

  if (findError) {
    return { ok: false, message: findError.message };
  }

  if (existing) {
    const { error } = await supabase
      .from("rehab_plan_events")
      .update(row)
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, message: error.message };
    }
    return ok({ ok: true, id: existing.id });
  }

  const { data: created, error } = await supabase
    .from("rehab_plan_events")
    .insert(row)
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, message: error?.message ?? "Insert failed." };
  }
  return ok({ ok: true, id: created.id });
}

export type DeleteRehabSeriesResult = { ok: true } | Err;

/** Delete an entire recurring series (master + all override rows). */
export async function deleteRehabSeries(
  seriesId: string,
): Promise<DeleteRehabSeriesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("rehab_plan_events")
    .delete()
    .eq("user_id", user.id)
    .eq("series_id", seriesId);

  if (error) {
    return { ok: false, message: error.message };
  }
  return ok({ ok: true });
}

export type SplitRehabSeriesResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

/**
 * "This and following": end the original series the day before `splitAt`, then
 * start a new series at `splitAt` with the supplied fields/rule. Overrides on or
 * after the split move to the new series.
 */
export async function splitRehabSeries(input: {
  seriesId: string;
  masterId: string;
  splitAt: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
  eventKind?: string;
  recurrence: RecurrenceRule;
}): Promise<SplitRehabSeriesResult> {
  const splitAt = new Date(input.splitAt);
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (
    Number.isNaN(splitAt.getTime()) ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime())
  ) {
    return { ok: false, message: "Invalid date or time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  // Load the original master to preserve its rule shape (interval/weekdays).
  const { data: master, error: masterError } = await supabase
    .from("rehab_plan_events")
    .select("recurrence_rule")
    .eq("id", input.masterId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (masterError || !master) {
    return { ok: false, message: masterError?.message ?? "Series not found." };
  }

  // End the original series the day before the split occurrence.
  const untilDate = new Date(splitAt);
  untilDate.setDate(untilDate.getDate() - 1);
  const until = untilDate.toISOString().slice(0, 10);

  let originalRule: RecurrenceRule | null = null;
  try {
    originalRule = master.recurrence_rule
      ? (JSON.parse(master.recurrence_rule) as RecurrenceRule)
      : null;
  } catch {
    originalRule = null;
  }
  if (originalRule) {
    const { error } = await supabase
      .from("rehab_plan_events")
      .update({
        recurrence_rule: serializeRecurrenceRule({ ...originalRule, until }),
      })
      .eq("id", input.masterId)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, message: error.message };
    }
  }

  // Create the new master.
  const { data: created, error: insertError } = await supabase
    .from("rehab_plan_events")
    .insert({
      user_id: user.id,
      title: input.title.trim() || "Untitled",
      description: input.description?.trim() || null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: input.allDay ?? false,
      color: isEventColor(input.color) ? input.color : "blue",
      event_kind: eventKindOrCustom(input.eventKind),
      recurrence_rule: serializeRecurrenceRule(input.recurrence),
    })
    .select("id")
    .single();
  if (insertError || !created) {
    return { ok: false, message: insertError?.message ?? "Insert failed." };
  }

  const { error: seriesError } = await supabase
    .from("rehab_plan_events")
    .update({ series_id: created.id })
    .eq("id", created.id)
    .eq("user_id", user.id);
  if (seriesError) {
    return { ok: false, message: seriesError.message };
  }

  // Move overrides on/after the split to the new series.
  const { error: moveError } = await supabase
    .from("rehab_plan_events")
    .update({ series_id: created.id })
    .eq("user_id", user.id)
    .eq("series_id", input.seriesId)
    .not("recurrence_at", "is", null)
    .gte("recurrence_at", splitAt.toISOString());
  if (moveError) {
    return { ok: false, message: moveError.message };
  }

  return ok({ ok: true, id: created.id });
}
