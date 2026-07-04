import { startOfDay } from "date-fns";

import {
  mapRehabPlanEvent,
  mapRehabSpeechRecording,
  REHAB_PLAN_EVENT_SELECT,
  REHAB_SPEECH_RECORDING_SELECT,
  type RehabPlanEventRow,
  type RehabSpeechRecordingRow,
} from "@/lib/rehab/rehab-plan-event-map";
import { parseRecurrenceRule } from "@/lib/rehab/recurrence";
import { filterRehabEventsForDay } from "@/lib/rehab/rehab-today-utils";
import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createClient } from "@/lib/supabase/server";
import type { RehabPlanEvent } from "@/types/rehab";

export type RehabFetchWindow = {
  start: Date;
  end: Date;
};

function masterCanExpandIntoWindow(
  row: RehabPlanEventRow,
  windowStart: Date,
  windowEnd: Date,
): boolean {
  if (!row.recurrence_rule || row.recurrence_at) {
    return false;
  }
  if (new Date(row.start_at).getTime() > windowEnd.getTime()) {
    return false;
  }
  const rule = parseRecurrenceRule(row.recurrence_rule);
  if (rule?.until) {
    const untilDay = startOfDay(new Date(rule.until));
    if (untilDay.getTime() < windowStart.getTime()) {
      return false;
    }
  }
  return true;
}

function mapRows(
  rows: RehabPlanEventRow[],
  recordingsByEventId: Map<string, ReturnType<typeof mapRehabSpeechRecording>[]>,
): RehabPlanEvent[] {
  return rows.map((row) =>
    mapRehabPlanEvent(row, recordingsByEventId.get(row.id) ?? []),
  );
}

/** PostgREST rejects very long `.in(...)` lists (400+ event ids on dashboard load). */
const SPEECH_RECORDING_IN_CHUNK = 100;

async function fetchSpeechRecordingsForEvents(
  eventIds: string[],
): Promise<Map<string, ReturnType<typeof mapRehabSpeechRecording>[]>> {
  const recordingsByEventId = new Map<
    string,
    ReturnType<typeof mapRehabSpeechRecording>[]
  >();
  if (eventIds.length === 0) {
    return recordingsByEventId;
  }

  const supabase = await createClient();
  const targetIds = new Set(eventIds);
  const rows: RehabSpeechRecordingRow[] = [];

  if (eventIds.length <= SPEECH_RECORDING_IN_CHUNK) {
    const { data, error: recordingsError } = await withoutSoftDeleted(
      supabase
        .from("rehab_speech_recordings")
        .select(REHAB_SPEECH_RECORDING_SELECT)
        .in("rehab_plan_event_id", eventIds),
    ).order("created_at", { ascending: false });

    if (recordingsError) {
      throw new Error(recordingsError.message);
    }
    rows.push(...((data ?? []) as RehabSpeechRecordingRow[]));
  } else {
    // Many ids — one RLS-scoped read beats chunking or blowing the URL limit.
    const { data, error: recordingsError } = await withoutSoftDeleted(
      supabase.from("rehab_speech_recordings").select(REHAB_SPEECH_RECORDING_SELECT),
    ).order("created_at", { ascending: false });

    if (recordingsError) {
      throw new Error(recordingsError.message);
    }

    for (const row of (data ?? []) as RehabSpeechRecordingRow[]) {
      if (targetIds.has(row.rehab_plan_event_id)) {
        rows.push(row);
      }
    }
  }

  for (const row of rows) {
    const recording = mapRehabSpeechRecording(row);
    const list = recordingsByEventId.get(recording.eventId) ?? [];
    list.push(recording);
    recordingsByEventId.set(recording.eventId, list);
  }

  return recordingsByEventId;
}

/** Windowed fetch for upcoming list, calendar views, etc. */
export async function fetchRehabPlanEventsInWindow(
  window: RehabFetchWindow,
): Promise<RehabPlanEvent[]> {
  const supabase = await createClient();
  const windowStart = window.start.toISOString();
  const windowEnd = window.end.toISOString();

  const [overlapResult, mastersResult] = await Promise.all([
    withoutSoftDeleted(
      supabase.from("rehab_plan_events").select(REHAB_PLAN_EVENT_SELECT),
    )
      .gte("end_at", windowStart)
      .lte("start_at", windowEnd)
      .order("start_at", { ascending: true }),
    withoutSoftDeleted(
      supabase.from("rehab_plan_events").select(REHAB_PLAN_EVENT_SELECT),
    )
      .not("recurrence_rule", "is", null)
      .is("recurrence_at", null)
      .lte("start_at", windowEnd)
      .order("start_at", { ascending: true }),
  ]);

  if (overlapResult.error) {
    throw new Error(overlapResult.error.message);
  }
  if (mastersResult.error) {
    throw new Error(mastersResult.error.message);
  }

  const byId = new Map<string, RehabPlanEventRow>();
  for (const row of (overlapResult.data ?? []) as RehabPlanEventRow[]) {
    byId.set(row.id, row);
  }
  for (const row of (mastersResult.data ?? []) as RehabPlanEventRow[]) {
    if (
      !byId.has(row.id) &&
      masterCanExpandIntoWindow(row, window.start, window.end)
    ) {
      byId.set(row.id, row);
    }
  }

  const rows = [...byId.values()].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
  const recordingsByEventId = await fetchSpeechRecordingsForEvents(
    rows.map((row) => row.id),
  );
  return mapRows(rows, recordingsByEventId);
}

export async function fetchRehabPlanEventsForUser(): Promise<RehabPlanEvent[]> {
  const supabase = await createClient();
  const { data, error } = await withoutSoftDeleted(
    supabase.from("rehab_plan_events").select(REHAB_PLAN_EVENT_SELECT),
  ).order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const eventRows = (data ?? []) as RehabPlanEventRow[];
  const recordingsByEventId = await fetchSpeechRecordingsForEvents(
    eventRows.map((row) => row.id),
  );
  return mapRows(eventRows, recordingsByEventId);
}

export async function fetchRehabTodayEventsForUser(): Promise<
  RehabPlanEvent[]
> {
  const events = await fetchRehabPlanEventsForUser();
  return filterRehabEventsForDay(events, startOfDay(new Date()));
}
