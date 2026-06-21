"use client";

import { format } from "date-fns";
import { Loader2, Mic, Plus, Square, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { VoiceMemoRecorderBar } from "@/components/rehab/voice-memo-recorder-bar";
import { SpeechAudioPlayer } from "@/components/rehab/speech-audio-player";
import { SpeechRecordingNoteField } from "@/components/rehab/speech-recording-note-field";
import { createClient } from "@/lib/supabase/client";
import { SpeechRecorderSession } from "@/lib/rehab/speech-recorder-session";
import { normalizeSpeechRecordingNote } from "@/lib/rehab/speech-recording-note";
import {
  fileExtensionForSpeechMime,
  formatSpeechDuration,
  preferredSpeechMimeType,
} from "@/lib/rehab/speech-recorder-utils";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { RehabSpeechRecording } from "@/types/rehab";

const SPEECH_RECORDINGS_BUCKET = "rehab-speech-recordings";
const EMPTY_RECORDINGS: RehabSpeechRecording[] = [];

type RecorderStatus = "idle" | "starting" | "recording" | "uploading";
type MicPermissionState = "prompt" | "granted" | "denied" | "unknown";
type PendingReview = {
  blob: Blob;
  durationSeconds: number;
};

export function RehabSpeechRecordingSection({
  eventId,
  eventStartAt,
  persistence,
  readOnly = false,
}: {
  eventId: string;
  eventStartAt: string;
  persistence: boolean;
  readOnly?: boolean;
}) {
  const recordings = useRehabPlanStore(
    (state) =>
      state.events.find((item) => item.id === eventId)?.speechRecordings ??
      EMPTY_RECORDINGS,
  );
  const completeSpeechRecordingUpload = useRehabPlanStore(
    (state) => state.completeSpeechRecordingUpload,
  );
  const deleteSpeechRecording = useRehabPlanStore(
    (state) => state.deleteSpeechRecording,
  );
  const replaceSpeechRecording = useRehabPlanStore(
    (state) => state.replaceSpeechRecording,
  );
  const updateSpeechRecordingNote = useRehabPlanStore(
    (state) => state.updateSpeechRecordingNote,
  );

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [waveformSamples, setWaveformSamples] = useState<number[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [recordAnother, setRecordAnother] = useState(false);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(
    null,
  );
  const [pendingNote, setPendingNote] = useState("");
  const [playbackRevision, setPlaybackRevision] = useState<
    Record<string, number>
  >({});
  const [micPermission, setMicPermission] =
    useState<MicPermissionState>("unknown");

  const sessionRef = useRef<SpeechRecorderSession | null>(null);
  const pendingStartRef = useRef(false);


  const canRecord = useMemo(
    () =>
      typeof window !== "undefined" &&
      typeof MediaRecorder !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia),
    [],
  );


  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    void navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (cancelled) {
          return;
        }
        permissionStatus = status;
        setMicPermission(status.state as MicPermissionState);
        status.onchange = () => {
          if (!cancelled) {
            setMicPermission(status.state as MicPermissionState);
          }
        };
      })
      .catch(() => {
        if (!cancelled) {
          setMicPermission("unknown");
        }
      });

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSignedUrls() {
      if (!persistence || recordings.length === 0) {
        setSignedUrls({});
        return;
      }

      const supabase = createClient();
      const entries = await Promise.all(
        recordings.map(async (item) => {
          const { data, error: signedUrlError } = await supabase.storage
            .from(SPEECH_RECORDINGS_BUCKET)
            .createSignedUrl(item.storagePath, 60 * 60);
          if (signedUrlError || !data?.signedUrl) {
            return null;
          }
          return [item.id, data.signedUrl] as const;
        }),
      );

      if (!cancelled) {
        const next: Record<string, string> = {};
        for (const entry of entries) {
          if (entry) {
            next[entry[0]] = entry[1];
          }
        }
        setSignedUrls(next);
      }
    }

    void loadSignedUrls();
    return () => {
      cancelled = true;
    };
  }, [persistence, recordings]);

  const uploadRecording = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      setStatus("uploading");
      setError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error(userError?.message ?? "Not signed in.");
        }

        const recordingId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}`;
        const mimeType = blob.type || preferredSpeechMimeType() || "audio/webm";
        const extension = fileExtensionForSpeechMime(mimeType);
        const storagePath = `${user.id}/${eventId}/${recordingId}.${extension}`;
        const fileName = `speech-${format(new Date(eventStartAt), "yyyy-MM-dd-HHmm")}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(SPEECH_RECORDINGS_BUCKET)
          .upload(storagePath, blob, {
            contentType: mimeType,
            upsert: false,
          });
        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const result = await completeSpeechRecordingUpload({
          eventId,
          storagePath,
          fileName,
          mimeType,
          sizeBytes: blob.size,
          durationSeconds,
          note: pendingNote,
        });
        if (!result.ok) {
          await supabase.storage
            .from(SPEECH_RECORDINGS_BUCKET)
            .remove([storagePath]);
          throw new Error(result.message);
        }

        setPendingReview(null);
        setPendingNote("");
        setRecordAnother(false);
        toast.success("Recording saved.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not save recording.";
        setError(message);
        toast.error(message);
      } finally {
        setStatus("idle");
      }
    },
    [completeSpeechRecordingUpload, eventId, eventStartAt, pendingNote],
  );

  useEffect(() => {
    sessionRef.current = new SpeechRecorderSession({
      onStateChange: (next) => {
        if (next === "recording") {
          setStatus("recording");
        } else if (next === "idle") {
          setStatus("idle");
          setElapsed(0);
          setAmplitude(0);
          setWaveformSamples([]);
        }
      },
      onElapsed: setElapsed,
      onAmplitude: setAmplitude,
      onWaveform: setWaveformSamples,
      onError: (message) => {
        setError(message);
        toast.error(message);
      },
      onComplete: ({ blob, durationSeconds }) => {
        setPendingReview({ blob, durationSeconds });
        setStatus("idle");
      },
    });

    return () => {
      void sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, []);

  async function startRecording() {
    if (!persistence) {
      setError("Sign in with sync enabled to save recordings.");
      return;
    }
    if (!canRecord) {
      setError(
        typeof window !== "undefined" && !window.isSecureContext
          ? "Microphone requires HTTPS or localhost. Open this app at http://localhost:3010 or use karriqi.com."
          : "Audio recording is not supported in this browser.",
      );
      return;
    }

    try {
      setError(null);
      pendingStartRef.current = true;
      // Show "starting" until the session confirms mic + MediaRecorder — avoids
      // a fake 0:00 recording UI while Safari waits on getUserMedia / play().
      setStatus("starting");
      setElapsed(0);

      await sessionRef.current?.start();
      if (!pendingStartRef.current) {
        return;
      }
      pendingStartRef.current = false;
      setMicPermission("granted");
    } catch (err) {
      pendingStartRef.current = false;
      setMicPermission("denied");
      setError(micAccessErrorMessage(err));
      setStatus("idle");
    }
  }

  function stopRecording() {
    if (pendingStartRef.current) {
      pendingStartRef.current = false;
      sessionRef.current?.cancelPendingStart();
      setStatus("idle");
      setElapsed(0);
      setAmplitude(0);
      setWaveformSamples([]);
      return;
    }
    sessionRef.current?.stop();
  }

  async function handleDelete(recording: RehabSpeechRecording) {
    const result = await deleteSpeechRecording(recording);
    if (result.ok) {
      toast.success("Recording removed.");
    }
  }

  async function handleReplaceRecording(
    recording: RehabSpeechRecording,
    blob: Blob,
    durationSeconds: number,
    mimeType: string,
  ) {
    const result = await replaceSpeechRecording(recording, {
      blob,
      mimeType,
      durationSeconds,
    });
    if (result.ok) {
      setPlaybackRevision((current) => ({
        ...current,
        [recording.id]: (current[recording.id] ?? 0) + 1,
      }));
      toast.success("Recording trimmed.");
    }
  }

  const hasRecordings = recordings.length > 0;
  const isRecording = status === "recording";
  const showRecorder =
    !pendingReview &&
    (status === "starting" ||
    status === "recording" ||
    status === "uploading" ||
    (!hasRecordings && !readOnly) ||
    (recordAnother && !readOnly));

  return (
    <>
      <div className="mt-3 w-full min-w-0 max-w-full shrink-0 space-y-3 overflow-x-hidden">
        {hasRecordings && !readOnly && status === "idle" && !recordAnother ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setRecordAnother(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white/55 transition-colors hover:bg-white/8 hover:text-white"
            >
              <Plus className="size-3.5" aria-hidden />
              New recording
            </button>
          </div>
        ) : null}

        {pendingReview ? (
          <div className="w-full min-w-0 space-y-3">
            <SpeechRecordingNoteField
              value={pendingNote}
              onChange={setPendingNote}
              disabled={status === "uploading"}
            />
            <SpeechAudioPlayer
              blob={pendingReview.blob}
              durationHint={pendingReview.durationSeconds}
              mimeType={pendingReview.blob.type}
              postRecord
              saving={status === "uploading"}
              onSave={uploadRecording}
              onDiscard={() => {
                setPendingReview(null);
                setPendingNote("");
              }}
            />
          </div>
        ) : null}

        {showRecorder ? (
          <RecorderPanel
            status={status}
            elapsed={elapsed}
            amplitude={amplitude}
            waveformSamples={waveformSamples}
            canStart={persistence}
            micPermission={micPermission}
            onStart={() => void startRecording()}
            onStop={stopRecording}
            onCancel={
              hasRecordings && status === "idle"
                ? () => {
                    setRecordAnother(false);
                    setError(null);
                  }
                : undefined
            }
          />
        ) : null}

        {!persistence ? (
          <p className="text-xs text-white/40">
            Recordings are available once sync is enabled.
          </p>
        ) : null}
        {isRecording ? (
          <p className="text-xs text-white/45">
            Recording continues while your phone sleeps. Tap stop when you are
            done, or use the lock-screen control.
          </p>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        {hasRecordings ? (
          <ul className="space-y-2">
            {recordings.map((item) => (
              <li
                key={item.id}
                className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2.5"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white/80">
                      {format(new Date(item.createdAt), "EEE d MMM yyyy, HH:mm")}
                    </p>
                    <p className="text-[11px] text-white/40">
                      {item.durationSeconds
                        ? formatSpeechDuration(Math.round(item.durationSeconds))
                        : "Saved recording"}
                    </p>
                  </div>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      className="shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
                      aria-label="Delete recording"
                      title="Delete recording"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>
                {!readOnly ? (
                  <SavedRecordingNote
                    recording={item}
                    onSave={async (note) => {
                      const result = await updateSpeechRecordingNote(
                        item,
                        note,
                      );
                      if (result.ok) {
                        toast.success("Note saved.");
                      }
                    }}
                  />
                ) : item.note ? (
                  <SavedRecordingNote
                    recording={item}
                    readOnly
                    onSave={async () => {}}
                  />
                ) : null}
                {signedUrls[item.id] ? (
                  <SpeechAudioPlayer
                    key={`${item.id}:${playbackRevision[item.id] ?? 0}`}
                    srcUrl={`${signedUrls[item.id]}${signedUrls[item.id].includes("?") ? "&" : "?"}v=${playbackRevision[item.id] ?? 0}`}
                    mimeType={item.mimeType}
                    durationHint={item.durationSeconds}
                    readOnly={readOnly}
                    onReplace={(blob, durationSeconds, mimeType) =>
                      handleReplaceRecording(
                        item,
                        blob,
                        durationSeconds,
                        mimeType,
                      )
                    }
                  />
                ) : (
                  <p className="text-[11px] text-white/40">Preparing playback…</p>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}

function SavedRecordingNote({
  recording,
  readOnly,
  onSave,
}: {
  recording: RehabSpeechRecording;
  readOnly?: boolean;
  onSave: (note: string | null) => Promise<void>;
}) {
  const [draft, setDraft] = useState(recording.note ?? "");

  useEffect(() => {
    setDraft(recording.note ?? "");
  }, [recording.id, recording.note]);

  return (
    <SpeechRecordingNoteField
      value={draft}
      onChange={setDraft}
      readOnly={readOnly}
      className="mb-2"
      onBlurSave={async () => {
        const nextNote = normalizeSpeechRecordingNote(draft);
        const currentNote = normalizeSpeechRecordingNote(recording.note);
        if (nextNote === currentNote) {
          return;
        }
        await onSave(nextNote);
      }}
    />
  );
}

function RecorderPanel({
  status,
  elapsed,
  amplitude,
  waveformSamples,
  canStart,
  micPermission,
  onStart,
  onStop,
  onCancel,
}: {
  status: RecorderStatus;
  elapsed: number;
  amplitude: number;
  waveformSamples: number[];
  canStart: boolean;
  micPermission: MicPermissionState;
  onStart: () => void;
  onStop: () => void;
  onCancel?: () => void;
}) {
  const isStarting = status === "starting";
  const isRecording = status === "recording";
  const isUploading = status === "uploading";
  const pulseScale = isRecording ? 1 + amplitude * 0.6 : 1;
  const glowOpacity = isRecording ? 0.25 + amplitude * 0.55 : 0;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {isRecording ? (
        <VoiceMemoRecorderBar
          elapsed={elapsed}
          waveformSamples={waveformSamples}
          onStop={onStop}
          className="max-w-full"
        />
      ) : (
        <div className="relative flex size-24 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-red-500 blur-xl transition-opacity"
            style={{ opacity: glowOpacity }}
            aria-hidden
          />
          <span
            className="absolute rounded-full bg-red-500/30 transition-transform duration-100 ease-out"
            style={{
              width: "6rem",
              height: "6rem",
              transform: `scale(${pulseScale})`,
            }}
            aria-hidden
          />
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting || isUploading || !canStart}
            className={cn(
              "relative flex size-16 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-red-500/90 hover:bg-red-500",
            )}
            aria-label={
              isStarting
                ? "Starting recording"
                : isRecording
                  ? "Stop recording"
                  : "Start recording"
            }
          >
            {isUploading || isStarting ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : isRecording ? (
              <Square className="size-6 fill-current" aria-hidden />
            ) : (
              <Mic className="size-7" aria-hidden />
            )}
          </button>
        </div>
      )}

      <p className="text-sm font-medium tabular-nums text-white/80">
        {isUploading
          ? "Saving…"
          : isStarting
            ? "Starting…"
            : isRecording
              ? formatSpeechDuration(elapsed)
              : "Tap to record"}
      </p>

      {!isRecording && !isUploading && micPermission === "denied" ? (
        <p className="max-w-xs text-center text-xs leading-relaxed text-amber-300/90">
          Microphone is blocked for this site. Open site settings from the lock
          icon in the address bar, set Microphone to Allow, then tap again.
        </p>
      ) : null}

      {isRecording ? (
        <p className="text-center text-xs text-white/45">
          Lock your phone to keep recording. Tap stop when finished.
        </p>
      ) : isStarting ? (
        <button
          type="button"
          onClick={onStop}
          className="text-xs text-white/45 transition-colors hover:text-white/70"
        >
          Cancel
        </button>
      ) : !isUploading && onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-white/45 transition-colors hover:text-white/70"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}


function micAccessErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      return "Microphone access is blocked. Allow microphone for this site in your browser settings, then tap record again.";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "No microphone was found on this device.";
    }
    if (err.name === "NotReadableError") {
      return "Your microphone is in use by another app. Close it and try again.";
    }
    if (err.message) {
      return err.message;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Microphone access was not available.";
}
