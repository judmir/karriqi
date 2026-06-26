"use client";

import { format } from "date-fns";
import { Download, Loader2, Mic, Plus, Square, Trash2 } from "lucide-react";
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
  clearStagedSpeechRecording,
  loadStagedSpeechRecording,
  stageSpeechRecordingForUpload,
  type StagedSpeechRecordingStatus,
} from "@/lib/rehab/speech-recording-staging";
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
type LocalStagedRecording = {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
  fileName: string;
  status: StagedSpeechRecordingStatus;
  uploadError?: string | null;
};

const LONG_RECORDING_WARN_SECONDS = [10 * 60, 30 * 60, 60 * 60] as const;

export function RehabSpeechRecordingSection({
  eventId,
  eventStartAt,
  persistence,
  readOnly = false,
  layout = "default",
}: {
  eventId: string;
  eventStartAt: string;
  persistence: boolean;
  readOnly?: boolean;
  layout?: "default" | "sidebar";
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
  const [playbackRevision, setPlaybackRevision] = useState<
    Record<string, number>
  >({});
  const [expandedRecordingId, setExpandedRecordingId] = useState<string | null>(
    null,
  );
  const [micPermission, setMicPermission] =
    useState<MicPermissionState>("unknown");
  const [stagedRecording, setStagedRecording] =
    useState<LocalStagedRecording | null>(null);

  const sessionRef = useRef<SpeechRecorderSession | null>(null);
  const pendingStartRef = useRef(false);
  const longRecordingWarningsShownRef = useRef<Set<number>>(new Set());
  const stageRecordingAfterStopRef = useRef<
    (blob: Blob, durationSeconds: number) => Promise<void>
  >(async () => {});


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

  useEffect(() => {
    let cancelled = false;

    void loadStagedSpeechRecording(eventId).then((staged) => {
      if (cancelled || !staged) {
        return;
      }

      const status =
        staged.status ??
        (staged.uploadError ? "upload-failed" : "pending-trim");

      setStagedRecording({
        blob: staged.blob,
        durationSeconds: staged.durationSeconds,
        mimeType: staged.mimeType,
        fileName: staged.fileName,
        status,
        uploadError: staged.uploadError,
      });

      if (status === "upload-failed") {
        setError(
          staged.uploadError ??
            "Cloud save failed. Trim and save again, or download the recording below.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const uploadPendingRecording = useCallback(
    async (pending: LocalStagedRecording): Promise<boolean> => {
      setStatus("uploading");
      setError(null);

      const mimeType = pending.mimeType;
      const extension = fileExtensionForSpeechMime(mimeType);
      const fileName = pending.fileName.includes(".")
        ? pending.fileName.replace(/\.[^./]+$/, `.${extension}`)
        : `${pending.fileName}.${extension}`;

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
        const storagePath = `${user.id}/${eventId}/${recordingId}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(SPEECH_RECORDINGS_BUCKET)
          .upload(storagePath, pending.blob, {
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
          sizeBytes: pending.blob.size,
          durationSeconds: pending.durationSeconds,
        });
        if (!result.ok) {
          await supabase.storage
            .from(SPEECH_RECORDINGS_BUCKET)
            .remove([storagePath]);
          throw new Error(result.message);
        }

        await clearStagedSpeechRecording(eventId);
        setStagedRecording(null);
        setRecordAnother(false);
        toast.success("Recording saved.");
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not save recording.";

        const failed: LocalStagedRecording = {
          ...pending,
          mimeType,
          fileName,
          status: "upload-failed",
          uploadError: message,
        };

        try {
          await stageSpeechRecordingForUpload({
            eventId,
            blob: failed.blob,
            durationSeconds: failed.durationSeconds,
            mimeType: failed.mimeType,
            fileName: failed.fileName,
            stagedAt: new Date().toISOString(),
            status: "upload-failed",
            uploadError: message,
          });
        } catch {
          // IndexedDB may be unavailable; in-memory staging still allows retry.
        }

        setStagedRecording(failed);
        setError(message);
        toast.error(
          `${message} Your recording is still on this device — adjust trim and save again, or download it.`,
          { duration: 10_000 },
        );
        return false;
      } finally {
        setStatus("idle");
      }
    },
    [completeSpeechRecordingUpload, eventId],
  );

  const stageRecordingAfterStop = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      const mimeType = blob.type || preferredSpeechMimeType() || "audio/webm";
      const extension = fileExtensionForSpeechMime(mimeType);
      const fileName = `speech-${format(new Date(eventStartAt), "yyyy-MM-dd-HHmm")}.${extension}`;
      const staged: LocalStagedRecording = {
        blob,
        durationSeconds,
        mimeType,
        fileName,
        status: "pending-trim",
      };

      try {
        await stageSpeechRecordingForUpload({
          eventId,
          ...staged,
          stagedAt: new Date().toISOString(),
        });
      } catch {
        // IndexedDB may be unavailable; trim UI still works in memory until reload.
      }

      setStagedRecording(staged);
      setRecordAnother(false);
      setError(null);
    },
    [eventId, eventStartAt],
  );

  useEffect(() => {
    stageRecordingAfterStopRef.current = stageRecordingAfterStop;
  }, [stageRecordingAfterStop]);

  useEffect(() => {
    sessionRef.current = new SpeechRecorderSession({
      onStateChange: (next) => {
        if (next === "recording") {
          setStatus("recording");
        } else if (next === "idle") {
          setStatus((current) => (current === "uploading" ? current : "idle"));
          setElapsed(0);
          setAmplitude(0);
          setWaveformSamples([]);
        }
      },
      onElapsed: (seconds) => {
        setElapsed(seconds);
        for (const threshold of LONG_RECORDING_WARN_SECONDS) {
          if (
            seconds >= threshold &&
            !longRecordingWarningsShownRef.current.has(threshold)
          ) {
            longRecordingWarningsShownRef.current.add(threshold);
            if (threshold === 10 * 60) {
              toast.info(
                "Long recording in progress. When you stop, trim and save — the full recording stays on this device until then.",
              );
            } else {
              toast.info(
                `Recording is ${formatSpeechDuration(seconds)}. Trim and save when you stop.`,
              );
            }
          }
        }
      },
      onAmplitude: setAmplitude,
      onWaveform: setWaveformSamples,
      onError: (message) => {
        setError(message);
        toast.error(message);
      },
      onComplete: ({ blob, durationSeconds }) => {
        void stageRecordingAfterStopRef.current(blob, durationSeconds);
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
    if (stagedRecording) {
      setError("Trim and save or discard the current recording before starting a new one.");
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
      longRecordingWarningsShownRef.current = new Set();
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

  async function handleDownloadBlob(blob: Blob, fileName: string) {
    try {
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName || "speech-recording.webm";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Could not download recording.");
    }
  }

  async function handleDownload(recording: RehabSpeechRecording) {
    const url = signedUrls[recording.id];
    if (!url) {
      toast.error("Recording is not ready to download yet.");
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Could not fetch recording.");
      }

      const blob = await response.blob();
      await handleDownloadBlob(blob, recording.fileName || "speech-recording.webm");
    } catch {
      toast.error("Could not download recording.");
    }
  }

  async function handleDiscardStaged() {
    await clearStagedSpeechRecording(eventId).catch(() => {});
    setStagedRecording(null);
    setError(null);
  }

  async function handleSaveStagedRecording(
    blob: Blob,
    durationSeconds: number,
  ) {
    if (!stagedRecording) {
      return;
    }

    const mimeType = blob.type || stagedRecording.mimeType;
    await uploadPendingRecording({
      ...stagedRecording,
      blob,
      durationSeconds,
      mimeType,
    });
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
    !stagedRecording &&
    (status === "starting" ||
      status === "recording" ||
      status === "uploading" ||
      (!hasRecordings && !readOnly) ||
      (recordAnother && !readOnly));

  const isSidebar = layout === "sidebar";

  return (
    <>
      <div
        className={cn(
          "w-full min-w-0 max-w-full shrink-0 space-y-3 overflow-x-hidden",
          isSidebar
            ? "border-t border-white/8 px-1.5 pt-3"
            : "mt-4 border-t border-white/10 pt-4",
        )}
      >
        {isSidebar ? (
          <p className="text-xs text-white/45">Recordings</p>
        ) : null}

        {stagedRecording ? (
          <StagedRecordingTrimPanel
            recording={stagedRecording}
            busy={status === "uploading"}
            readOnly={readOnly}
            onSave={async (blob, durationSeconds) => {
              await handleSaveStagedRecording(blob, durationSeconds);
            }}
            onDownload={() =>
              void handleDownloadBlob(
                stagedRecording.blob,
                stagedRecording.fileName,
              )
            }
            onDiscard={() => void handleDiscardStaged()}
          />
        ) : null}

        {hasRecordings ? (
          <ul className={cn("space-y-3", isSidebar && "space-y-2.5")}>
            {recordings.map((item) => {
              const isExpanded = expandedRecordingId === item.id;
              return (
              <li
                key={item.id}
                className="min-w-0 overflow-hidden"
              >
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-white/80">
                      {isSidebar
                        ? format(new Date(item.createdAt), "EEE HH:mm")
                        : format(
                            new Date(item.createdAt),
                            "EEE d MMM yyyy, HH:mm",
                          )}
                    </p>
                    {!isSidebar ? (
                      <p className="text-[11px] text-white/45">
                        {item.durationSeconds
                          ? formatSpeechDuration(
                              Math.round(item.durationSeconds),
                            )
                          : "Saved recording"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {signedUrls[item.id] ? (
                      <button
                        type="button"
                        onClick={() => void handleDownload(item)}
                        className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Download recording"
                        title="Download recording"
                      >
                        <Download className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRecordingId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                        className="rounded-md px-2 py-1 text-xs font-medium text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        {isExpanded ? "Done" : "Edit"}
                      </button>
                    ) : null}
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
                        aria-label="Delete recording"
                        title="Delete recording"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
                {(item.note || (isExpanded && !readOnly)) ? (
                  <SavedRecordingNote
                    recording={item}
                    readOnly={readOnly || !isExpanded}
                    onSave={async (note) => {
                      if (readOnly || !isExpanded) {
                        return;
                      }
                      const result = await updateSpeechRecordingNote(
                        item,
                        note,
                      );
                      if (result.ok) {
                        toast.success("Note saved.");
                      }
                    }}
                  />
                ) : null}
                {signedUrls[item.id] ? (
                  <SpeechAudioPlayer
                    key={`${item.id}:${playbackRevision[item.id] ?? 0}:${isExpanded ? "full" : "compact"}`}
                    srcUrl={`${signedUrls[item.id]}${signedUrls[item.id].includes("?") ? "&" : "?"}v=${playbackRevision[item.id] ?? 0}`}
                    mimeType={item.mimeType}
                    durationHint={item.durationSeconds}
                    readOnly={readOnly}
                    compact={!isExpanded}
                    onReplace={
                      isExpanded
                        ? (blob, durationSeconds, mimeType) =>
                            handleReplaceRecording(
                              item,
                              blob,
                              durationSeconds,
                              mimeType,
                            )
                        : undefined
                    }
                  />
                ) : (
                  <p className="text-[11px] text-white/40">Preparing playback…</p>
                )}
              </li>
            );
            })}
          </ul>
        ) : null}

        {hasRecordings && !readOnly && status === "idle" && !recordAnother ? (
          <div className={cn("flex", isSidebar ? "justify-start" : "justify-end")}>
            <button
              type="button"
              onClick={() => setRecordAnother(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white/55 transition-colors hover:bg-white/8 hover:text-white"
            >
              <Plus className="size-3.5" aria-hidden />
              New
            </button>
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
            compact={isSidebar}
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
            Recording continues while your phone sleeps. Tap stop when finished
            — then trim and save.
          </p>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </>
  );
}

function StagedRecordingTrimPanel({
  recording,
  busy,
  readOnly,
  onSave,
  onDownload,
  onDiscard,
}: {
  recording: LocalStagedRecording;
  busy: boolean;
  readOnly: boolean;
  onSave: (blob: Blob, durationSeconds: number) => Promise<void>;
  onDownload: () => void;
  onDiscard: () => void;
}) {
  const sizeMb = (recording.blob.size / (1024 * 1024)).toFixed(1);
  const isUploadFailed = recording.status === "upload-failed";

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-3",
        isUploadFailed
          ? "border-amber-400/25 bg-amber-400/8"
          : "border-white/12 bg-white/5",
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">
          {isUploadFailed ? "Cloud save failed" : "Trim and save"}
        </p>
        <p className="text-xs leading-relaxed text-white/55">
          {isUploadFailed && recording.uploadError ? (
            <>
              {recording.uploadError}{" "}
            </>
          ) : null}
          {formatSpeechDuration(Math.round(recording.durationSeconds))} recording
          ({sizeMb} MB) — kept on this device until you save or discard.
        </p>
      </div>
      <SpeechAudioPlayer
        blob={recording.blob}
        mimeType={recording.mimeType}
        durationHint={recording.durationSeconds}
        postRecord
        initialTrimMode
        saving={busy}
        readOnly={readOnly}
        onSave={onSave}
        onDiscard={readOnly ? undefined : onDiscard}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white/85 transition-colors hover:bg-white/8"
        >
          <Download className="size-3.5" aria-hidden />
          Download full recording
        </button>
      </div>
    </div>
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
  compact = false,
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
  compact?: boolean;
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
    <div className={cn("flex flex-col items-center gap-3", compact ? "py-1" : "py-2")}>
      {isRecording ? (
        <VoiceMemoRecorderBar
          elapsed={elapsed}
          waveformSamples={waveformSamples}
          onStop={onStop}
          className="max-w-full"
        />
      ) : (
        <div
          className={cn(
            "relative flex items-center justify-center",
            compact ? "size-16" : "size-24",
          )}
        >
          <span
            className="absolute inset-0 rounded-full bg-red-500 blur-xl transition-opacity"
            style={{ opacity: glowOpacity }}
            aria-hidden
          />
          <span
            className="absolute rounded-full bg-red-500/30 transition-transform duration-100 ease-out"
            style={{
              width: compact ? "4rem" : "6rem",
              height: compact ? "4rem" : "6rem",
              transform: `scale(${pulseScale})`,
            }}
            aria-hidden
          />
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting || isUploading || !canStart}
            className={cn(
              "relative flex items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "size-11" : "size-16",
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
              <Loader2 className={cn("animate-spin", compact ? "size-5" : "size-6")} aria-hidden />
            ) : isRecording ? (
              <Square className={cn("fill-current", compact ? "size-5" : "size-6")} aria-hidden />
            ) : (
              <Mic className={compact ? "size-5" : "size-7"} aria-hidden />
            )}
          </button>
        </div>
      )}

      <p
        className={cn(
          "font-medium tabular-nums text-white/80",
          compact ? "text-xs" : "text-sm",
        )}
      >
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
