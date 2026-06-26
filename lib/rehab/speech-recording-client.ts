import { normalizeSpeechRecordingNote } from "@/lib/rehab/speech-recording-note";
import { softDeletePatch } from "@/lib/db/soft-delete";
import { fetchSpeechAudioBlob, prepareSpeechRecordingDownloadBlob } from "@/lib/rehab/speech-audio-utils";
import { mapSpeechRecording } from "@/lib/rehab/map-speech-recording";
import { replaceSpeechRecordingExtension, speechRecordingDownloadFileName } from "@/lib/rehab/speech-recorder-utils";
import { createClient } from "@/lib/supabase/client";
import type { RehabSpeechRecording } from "@/types/rehab";

const SPEECH_RECORDINGS_BUCKET = "rehab-speech-recordings";

export type CompleteSpeechRecordingUploadResult =
  | { ok: true; recording: RehabSpeechRecording }
  | { ok: false; message: string };

export type DeleteSpeechRecordingResult =
  | { ok: true }
  | { ok: false; message: string };

const SPEECH_RECORDING_ROW_SELECT =
  "id, rehab_plan_event_id, user_id, file_name, mime_type, size_bytes, duration_seconds, storage_path, note, created_at";

export async function completeSpeechRecordingUploadClient(input: {
  eventId: string;
  storagePath: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  note?: string | null;
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
      note: normalizeSpeechRecordingNote(input.note),
    })
    .select(SPEECH_RECORDING_ROW_SELECT)
    .single();

  if (error || !recording) {
    return { ok: false, message: error?.message ?? "Recording save failed." };
  }

  return { ok: true, recording: mapSpeechRecording(recording) };
}

export type ReplaceSpeechRecordingResult =
  | { ok: true; recording: RehabSpeechRecording }
  | { ok: false; message: string };

export async function replaceSpeechRecordingClient(input: {
  id: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}): Promise<ReplaceSpeechRecordingResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Not signed in." };
  }

  const { data: existing, error: findError } = await supabase
    .from("rehab_speech_recordings")
    .select(SPEECH_RECORDING_ROW_SELECT)
    .eq("id", input.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError || !existing) {
    return {
      ok: false,
      message: findError?.message ?? "Recording not found.",
    };
  }

  const nextStoragePath = replaceSpeechRecordingExtension(
    existing.storage_path,
    input.mimeType,
  );
  const nextFileName = replaceSpeechRecordingExtension(
    existing.file_name,
    input.mimeType,
  );
  const pathsToRemove =
    nextStoragePath === existing.storage_path
      ? [existing.storage_path]
      : [existing.storage_path, nextStoragePath];

  const { error: removeError } = await supabase.storage
    .from(SPEECH_RECORDINGS_BUCKET)
    .remove(pathsToRemove);
  if (removeError) {
    return { ok: false, message: removeError.message };
  }

  const { error: uploadError } = await supabase.storage
    .from(SPEECH_RECORDINGS_BUCKET)
    .upload(nextStoragePath, input.blob, {
      contentType: input.mimeType,
      upsert: false,
    });
  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: recording, error: updateError } = await supabase
    .from("rehab_speech_recordings")
    .update({
      file_name: nextFileName,
      storage_path: nextStoragePath,
      mime_type: input.mimeType,
      size_bytes: input.blob.size,
      duration_seconds: input.durationSeconds,
    })
    .eq("id", input.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select(SPEECH_RECORDING_ROW_SELECT)
    .single();

  if (updateError || !recording) {
    return {
      ok: false,
      message: updateError?.message ?? "Recording update failed.",
    };
  }

  return { ok: true, recording: mapSpeechRecording(recording) };
}

export type UpdateSpeechRecordingNoteResult =
  | { ok: true; recording: RehabSpeechRecording }
  | { ok: false; message: string };

export async function updateSpeechRecordingNoteClient(input: {
  id: string;
  note: string | null;
}): Promise<UpdateSpeechRecordingNoteResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Not signed in." };
  }

  const { data: recording, error } = await supabase
    .from("rehab_speech_recordings")
    .update({ note: normalizeSpeechRecordingNote(input.note) })
    .eq("id", input.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select(SPEECH_RECORDING_ROW_SELECT)
    .single();

  if (error || !recording) {
    return { ok: false, message: error?.message ?? "Could not save note." };
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

export type DownloadSpeechRecordingResult =
  | { ok: true }
  | { ok: false; message: string };

export async function createSpeechRecordingSignedUrlClient(
  storagePath: string,
  expiresInSeconds = 60 * 60,
): Promise<{ ok: true; signedUrl: string } | { ok: false; message: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(SPEECH_RECORDINGS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) {
    return {
      ok: false,
      message: error?.message ?? "Could not prepare recording.",
    };
  }
  return { ok: true, signedUrl: data.signedUrl };
}

export async function downloadSpeechRecordingClient(input: {
  storagePath: string;
  fileName: string;
  mimeType?: string | null;
  signedUrl?: string | null;
}): Promise<DownloadSpeechRecordingResult> {
  let signedUrl = input.signedUrl ?? null;
  if (!signedUrl) {
    const signed = await createSpeechRecordingSignedUrlClient(input.storagePath);
    if (!signed.ok) {
      return signed;
    }
    signedUrl = signed.signedUrl;
  }

  try {
    const sourceBlob = await fetchSpeechAudioBlob(signedUrl);
    const downloadBlob = await prepareSpeechRecordingDownloadBlob(
      sourceBlob,
      input.mimeType ?? sourceBlob.type,
    );
    const objectUrl = URL.createObjectURL(downloadBlob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = speechRecordingDownloadFileName(input.fileName);
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not download recording.",
    };
  }
}
