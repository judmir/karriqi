import { softDeletePatch } from "@/lib/db/soft-delete";
import { mapSpeechRecording } from "@/lib/rehab/map-speech-recording";
import { createClient } from "@/lib/supabase/client";
import type { RehabSpeechRecording } from "@/types/rehab";

const SPEECH_RECORDINGS_BUCKET = "rehab-speech-recordings";

export type CompleteSpeechRecordingUploadResult =
  | { ok: true; recording: RehabSpeechRecording }
  | { ok: false; message: string };

export type DeleteSpeechRecordingResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeSpeechRecordingUploadClient(input: {
  eventId: string;
  storagePath: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
}): Promise<CompleteSpeechRecordingUploadResult> {
  const fileName = input.fileName.trim();
  const storagePath = input.storagePath.trim();
  if (!fileName || !storagePath) {
    return { ok: false, message: "Recording file is missing." };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Not signed in." };
  }

  if (!storagePath.startsWith(`${user.id}/${input.eventId}/`)) {
    return { ok: false, message: "Invalid recording path." };
  }

  const { data: event, error: eventError } = await supabase
    .from("rehab_plan_events")
    .select("id, event_kind")
    .eq("id", input.eventId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
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

  return { ok: true, recording: mapSpeechRecording(recording) };
}

export async function deleteSpeechRecordingClient(input: {
  id: string;
}): Promise<DeleteSpeechRecordingResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Not signed in." };
  }

  const { data: recording, error: findError } = await supabase
    .from("rehab_speech_recordings")
    .select("id, storage_path")
    .eq("id", input.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError || !recording) {
    return {
      ok: false,
      message: findError?.message ?? "Recording not found.",
    };
  }

  const { error: storageError } = await supabase.storage
    .from(SPEECH_RECORDINGS_BUCKET)
    .remove([recording.storage_path]);
  if (storageError) {
    return { ok: false, message: storageError.message };
  }

  const { error } = await supabase
    .from("rehab_speech_recordings")
    .update(softDeletePatch())
    .eq("id", input.id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
