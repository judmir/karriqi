import { startOfDay } from "date-fns";

import {
  mapRehabPlanEvent,
  mapRehabSpeechRecording,
  REHAB_PLAN_EVENT_SELECT,
  REHAB_SPEECH_RECORDING_SELECT,
  type RehabPlanEventRow,
  type RehabSpeechRecordingRow,
} from "@/lib/rehab/rehab-plan-event-map";
import { filterRehabEventsForDay } from "@/lib/rehab/rehab-today-utils";
import { createClient } from "@/lib/supabase/server";
import type { RehabPlanEvent } from "@/types/rehab";

export async function fetchRehabPlanEventsForUser(): Promise<RehabPlanEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_plan_events")
    .select(REHAB_PLAN_EVENT_SELECT)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const eventRows = (data ?? []) as RehabPlanEventRow[];
  const recordingsByEventId = new Map<
    string,
    ReturnType<typeof mapRehabSpeechRecording>[]
  >();

  if (eventRows.length > 0) {
    const { data: recordingRows, error: recordingsError } = await supabase
      .from("rehab_speech_recordings")
      .select(REHAB_SPEECH_RECORDING_SELECT)
      .order("created_at", { ascending: false });

    if (recordingsError) {
      throw new Error(recordingsError.message);
    }

    for (const row of (recordingRows ?? []) as RehabSpeechRecordingRow[]) {
      const recording = mapRehabSpeechRecording(row);
      const list = recordingsByEventId.get(recording.eventId) ?? [];
      list.push(recording);
      recordingsByEventId.set(recording.eventId, list);
    }
  }

  return eventRows.map((row) =>
    mapRehabPlanEvent(row, recordingsByEventId.get(row.id) ?? []),
  );
}

export async function fetchRehabTodayEventsForUser(): Promise<
  RehabPlanEvent[]
> {
  const events = await fetchRehabPlanEventsForUser();
  return filterRehabEventsForDay(events, startOfDay(new Date()));
}
