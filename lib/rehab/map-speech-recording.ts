import type { Database } from "@/types/database";
import type { RehabSpeechRecording } from "@/types/rehab";

type RehabSpeechRecordingRow =
  Database["public"]["Tables"]["rehab_speech_recordings"]["Row"];

export function mapSpeechRecording(
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
    note: row.note,
    createdAt: row.created_at,
  };
}
