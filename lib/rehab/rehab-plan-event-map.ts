import type { CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";
import { parseRecurrenceRule } from "@/lib/rehab/recurrence";
import {
  REHAB_EVENT_KINDS,
  type RehabEventKind,
  type RehabPlanEvent,
  type RehabSpeechRecording,
} from "@/types/rehab";

export type RehabPlanEventRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: string;
  completed_at: string | null;
  event_kind: string;
  program_id: string | null;
  plan_week: number | null;
  series_id: string | null;
  recurrence_rule: string | null;
  recurrence_at: string | null;
  recurrence_cancelled: boolean;
  created_at: string;
  updated_at: string;
};

export type RehabSpeechRecordingRow = {
  id: string;
  rehab_plan_event_id: string;
  user_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  storage_path: string;
  created_at: string;
};

export const REHAB_PLAN_EVENT_SELECT =
  "id, user_id, title, description, start_at, end_at, all_day, color, completed_at, event_kind, program_id, plan_week, series_id, recurrence_rule, recurrence_at, recurrence_cancelled, created_at, updated_at";

function isEventColor(value: string): value is CalendarEventColor {
  return (CALENDAR_EVENT_COLORS as readonly string[]).includes(value);
}

function isEventKind(value: string): value is RehabEventKind {
  return (REHAB_EVENT_KINDS as readonly string[]).includes(
    value as RehabEventKind,
  );
}

export const REHAB_SPEECH_RECORDING_SELECT =
  "id, rehab_plan_event_id, user_id, file_name, mime_type, size_bytes, duration_seconds, storage_path, created_at";

export function mapRehabSpeechRecording(
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

export function mapRehabPlanEvent(
  row: RehabPlanEventRow,
  speechRecordings: RehabSpeechRecording[] = [],
): RehabPlanEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    color: isEventColor(row.color) ? row.color : "blue",
    source: "local",
    completedAt: row.completed_at,
    eventKind: isEventKind(row.event_kind) ? row.event_kind : "custom",
    programId: row.program_id,
    planWeek: row.plan_week,
    speechRecordings,
    seriesId: row.series_id,
    recurrence: parseRecurrenceRule(row.recurrence_rule),
    recurrenceAt: row.recurrence_at,
    recurrenceCancelled: row.recurrence_cancelled ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
