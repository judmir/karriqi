"use client";

import {
  Loader2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clampTrimRange,
  decodeSpeechAudioBlob,
  fetchSpeechAudioBlob,
  formatSpeechTimePrecise,
  peaksFromAudioBuffer,
  trimSpeechAudioBlob,
  type SpeechAudioMetadata,
} from "@/lib/rehab/speech-audio-utils";
import { formatSpeechDuration } from "@/lib/rehab/speech-recorder-utils";
import { cn } from "@/lib/utils";

const SKIP_SECONDS = 15;
const HANDLE_WIDTH_PX = 14;

type SpeechAudioPlayerProps = {
  blob?: Blob | null;
  srcUrl?: string | null;
  mimeType?: string | null;
  durationHint?: number | null;
  readOnly?: boolean;
  saving?: boolean;
  postRecord?: boolean;
  onSave?: (blob: Blob, durationSeconds: number) => Promise<void>;
  onReplace?: (
    blob: Blob,
    durationSeconds: number,
    mimeType: string,
  ) => Promise<void>;
  onDiscard?: () => void;
};

export function SpeechAudioPlayer({
  blob: blobProp,
  srcUrl,
  mimeType,
  durationHint,
  readOnly = false,
  saving = false,
  postRecord = false,
  onSave,
  onReplace,
  onDiscard,
}: SpeechAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<
    | null
    | {
        mode: "start" | "end" | "seek";
        pointerId: number;
      }
  >(null);

  const [blob, setBlob] = useState<Blob | null>(blobProp ?? null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SpeechAudioMetadata | null>(null);
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimMode, setTrimMode] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [processing, setProcessing] = useState(false);

  const durationSeconds =
    metadata?.durationSeconds ?? durationHint ?? 0;
  const peaks = metadata?.peaks ?? [];

  useEffect(() => {
    if (blobProp) {
      setBlob(blobProp);
    }
  }, [blobProp]);

  useEffect(() => {
    let cancelled = false;
    let nextObjectUrl: string | null = null;

    async function loadSource() {
      setLoading(true);
      setLoadError(null);
      setMetadata(null);
      setDecodedBuffer(null);
      setCurrentTime(0);
      setIsPlaying(false);
      setTrimMode(false);

      try {
        let sourceBlob = blob;
        if (!sourceBlob && srcUrl) {
          sourceBlob = await fetchSpeechAudioBlob(srcUrl);
        }
        if (!sourceBlob) {
          throw new Error("Recording is not available.");
        }
        if (cancelled) {
          return;
        }

        nextObjectUrl = URL.createObjectURL(sourceBlob);
        const decoded = await decodeSpeechAudioBlob(sourceBlob);
        const nextMetadata = {
          durationSeconds: decoded.duration,
          peaks: peaksFromAudioBuffer(decoded),
        };
        if (cancelled) {
          URL.revokeObjectURL(nextObjectUrl);
          return;
        }

        setBlob(sourceBlob);
        setObjectUrl(nextObjectUrl);
        setMetadata(nextMetadata);
        setDecodedBuffer(decoded);
        setTrimStart(0);
        setTrimEnd(nextMetadata.durationSeconds);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load recording.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSource();

    return () => {
      cancelled = true;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [blob, srcUrl]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const playheadRatio = durationSeconds > 0 ? currentTime / durationSeconds : 0;
  const trimStartRatio =
    durationSeconds > 0 ? trimStart / durationSeconds : 0;
  const trimEndRatio = durationSeconds > 0 ? trimEnd / durationSeconds : 1;

  const displayTime = trimMode ? trimStart : currentTime;

  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || durationSeconds <= 0) {
        return;
      }
      const clamped = Math.max(
        trimMode ? trimStart : 0,
        Math.min(seconds, trimMode ? trimEnd : durationSeconds),
      );
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [durationSeconds, trimEnd, trimMode, trimStart],
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) {
      return;
    }

    if (isPlaying) {
      pausePlayback();
      return;
    }

    if (trimMode) {
      if (currentTime < trimStart || currentTime >= trimEnd) {
        audio.currentTime = trimStart;
        setCurrentTime(trimStart);
      }
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [
    currentTime,
    isPlaying,
    objectUrl,
    pausePlayback,
    trimEnd,
    trimMode,
    trimStart,
  ]);

  const skipBy = useCallback(
    (delta: number) => {
      const min = trimMode ? trimStart : 0;
      const max = trimMode ? trimEnd : durationSeconds;
      seekTo(Math.max(min, Math.min(currentTime + delta, max)));
    },
    [currentTime, durationSeconds, seekTo, trimEnd, trimMode, trimStart],
  );

  const updateTrimFromPointer = useCallback(
    (clientX: number, mode: "start" | "end" | "seek") => {
      const waveform = waveformRef.current;
      if (!waveform || durationSeconds <= 0) {
        return;
      }

      const rect = waveform.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const seconds = ratio * durationSeconds;

      if (mode === "seek") {
        const min = trimMode ? trimStart : 0;
        const max = trimMode ? trimEnd : durationSeconds;
        seekTo(Math.max(min, Math.min(seconds, max)));
        return;
      }

      if (mode === "start") {
        const next = clampTrimRange(seconds, trimEnd, durationSeconds);
        setTrimStart(next.start);
        setTrimEnd(next.end);
        seekTo(next.start);
        return;
      }

      const next = clampTrimRange(trimStart, seconds, durationSeconds);
      setTrimStart(next.start);
      setTrimEnd(next.end);
      if (currentTime > next.end) {
        seekTo(next.end);
      }
    },
    [currentTime, durationSeconds, seekTo, trimEnd, trimMode, trimStart],
  );

  const handleWaveformPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (readOnly || !durationSeconds) {
      return;
    }

    const waveform = waveformRef.current;
    if (!waveform) {
      return;
    }

    const rect = waveform.getBoundingClientRect();
    const x = event.clientX - rect.left;
    let mode: "start" | "end" | "seek" = "seek";

    if (trimMode) {
      const startX = trimStartRatio * rect.width;
      const endX = trimEndRatio * rect.width;
      if (Math.abs(x - startX) <= HANDLE_WIDTH_PX) {
        mode = "start";
      } else if (Math.abs(x - endX) <= HANDLE_WIDTH_PX) {
        mode = "end";
      }
    }

    dragRef.current = { mode, pointerId: event.pointerId };
    waveform.setPointerCapture(event.pointerId);
    updateTrimFromPointer(event.clientX, mode);
  };

  const handleWaveformPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    updateTrimFromPointer(event.clientX, drag.mode);
  };

  const handleWaveformPointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onTimeUpdate = () => {
      const nextTime = audio.currentTime;
      setCurrentTime(nextTime);
      if (trimMode && nextTime >= trimEnd) {
        audio.pause();
        audio.currentTime = trimEnd;
        setCurrentTime(trimEnd);
        setIsPlaying(false);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [trimEnd, trimMode, objectUrl]);

  const hasTrimChanges = useMemo(() => {
    if (!durationSeconds) {
      return false;
    }
    return trimStart > 0.05 || trimEnd < durationSeconds - 0.05;
  }, [durationSeconds, trimEnd, trimStart]);

  async function handleApplyTrim() {
    if (!blob || readOnly) {
      return;
    }

    setProcessing(true);
    pausePlayback();

    try {
      const trimmed = await trimSpeechAudioBlob(
        blob,
        trimStart,
        trimEnd,
        decodedBuffer ?? undefined,
      );

      if (postRecord && onSave) {
        await onSave(trimmed.blob, trimmed.durationSeconds);
        return;
      }

      if (onReplace) {
        await onReplace(
          trimmed.blob,
          trimmed.durationSeconds,
          trimmed.mimeType,
        );
      }

      setTrimMode(false);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSaveFull() {
    if (!blob || !onSave) {
      return;
    }
    setProcessing(true);
    pausePlayback();
    try {
      await onSave(blob, durationSeconds);
    } finally {
      setProcessing(false);
    }
  }

  function handleCancelTrim() {
    pausePlayback();
    setTrimMode(false);
    setTrimStart(0);
    setTrimEnd(durationSeconds);
    seekTo(0);
  }

  function handleEnterTrimMode() {
    if (readOnly || !durationSeconds) {
      return;
    }
    pausePlayback();
    setTrimMode(true);
    setTrimStart(0);
    setTrimEnd(durationSeconds);
    seekTo(0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/45">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="ml-2 text-sm">Loading waveform…</span>
      </div>
    );
  }

  if (loadError) {
    return <p className="text-xs text-red-400">{loadError}</p>;
  }

  const busy = saving || processing;

  return (
    <div className="space-y-4">
      {objectUrl ? (
        <audio ref={audioRef} src={objectUrl} preload="auto" className="hidden" />
      ) : null}

      <div className="space-y-1.5">
        <div
          ref={waveformRef}
          className={cn(
            "relative h-16 overflow-hidden rounded-xl bg-[#2b2b2b] touch-none",
            !readOnly && "cursor-pointer",
          )}
          onPointerDown={handleWaveformPointerDown}
          onPointerMove={handleWaveformPointerMove}
          onPointerUp={handleWaveformPointerUp}
          onPointerCancel={handleWaveformPointerUp}
          role="slider"
          aria-label="Audio waveform"
          aria-valuemin={0}
          aria-valuemax={durationSeconds}
          aria-valuenow={currentTime}
        >
          <WaveformBars peaks={peaks} />

          {trimMode ? (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-black/45"
                style={{ width: `${trimStartRatio * 100}%` }}
                aria-hidden
              />
              <div
                className="absolute inset-y-0 right-0 bg-black/45"
                style={{ width: `${(1 - trimEndRatio) * 100}%` }}
                aria-hidden
              />
              <div
                className="absolute inset-y-1 rounded-sm border-2 border-[#ffd60a] bg-[#ffd60a]/10"
                style={{
                  left: `${trimStartRatio * 100}%`,
                  width: `${Math.max(0, trimEndRatio - trimStartRatio) * 100}%`,
                }}
                aria-hidden
              >
                <TrimHandle side="start" />
                <TrimHandle side="end" />
              </div>
            </>
          ) : null}

          <div
            className="absolute inset-y-0 w-0.5 bg-[#0a84ff]"
            style={{ left: `${playheadRatio * 100}%` }}
            aria-hidden
          />
        </div>

        <div className="flex justify-between px-0.5 text-[11px] tabular-nums text-white/40">
          <span>{formatSpeechDuration(Math.floor(trimMode ? trimStart : 0))}</span>
          <span>{formatSpeechDuration(Math.floor(durationSeconds))}</span>
        </div>
      </div>

      <p className="text-center text-3xl font-light tabular-nums tracking-tight text-white">
        {formatSpeechTimePrecise(displayTime)}
      </p>

      <div className="flex justify-center">
        <div className="flex items-center gap-5 rounded-full bg-[#2b2b2b] px-5 py-2.5">
          <SkipButton
            direction="back"
            disabled={busy}
            onClick={() => skipBy(-SKIP_SECONDS)}
          />
          <button
            type="button"
            onClick={() => void togglePlayback()}
            disabled={busy}
            className="flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-5 fill-current" aria-hidden />
            ) : (
              <Play className="size-5 fill-current" aria-hidden />
            )}
          </button>
          <SkipButton
            direction="forward"
            disabled={busy}
            onClick={() => skipBy(SKIP_SECONDS)}
          />
        </div>
      </div>

      {!readOnly ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleEnterTrimMode}
            disabled={busy || trimMode}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              trimMode
                ? "bg-white/10 text-white"
                : "bg-white/8 text-white/80 hover:bg-white/12 hover:text-white",
            )}
          >
            Trim
          </button>

          <div className="flex items-center gap-2">
            {trimMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelTrim}
                  disabled={busy}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/8 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleApplyTrim()}
                  disabled={busy || !hasTrimChanges}
                  className="rounded-full bg-[#ffd60a] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Trimming…" : "Apply"}
                </button>
              </>
            ) : postRecord ? (
              <>
                {onDiscard ? (
                  <button
                    type="button"
                    onClick={onDiscard}
                    disabled={busy}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/8 disabled:opacity-50"
                  >
                    Discard
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSaveFull()}
                  disabled={busy}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WaveformBars({ peaks }: { peaks: number[] }) {
  if (peaks.length === 0) {
    return (
      <div className="flex h-full items-end gap-px px-2 py-3">
        {Array.from({ length: 80 }).map((_, index) => (
          <span
            key={`empty-bar-${index}`}
            className="w-[2px] flex-1 rounded-full bg-white/25"
            style={{ height: `${20 + (index % 5) * 8}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full items-end gap-px px-2 py-3">
      {peaks.map((peak, index) => (
        <span
          key={`peak-${index}`}
          className="w-[2px] flex-1 rounded-full bg-white/85"
          style={{ height: `${Math.max(8, peak * 100)}%` }}
        />
      ))}
    </div>
  );
}

function TrimHandle({ side }: { side: "start" | "end" }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm bg-[#ffd60a] text-[10px] font-bold text-black shadow",
        side === "start" ? "-left-2.5" : "-right-2.5",
      )}
      aria-hidden
    >
      {side === "start" ? "‹" : "›"}
    </span>
  );
}

function SkipButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "back" | "forward";
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "back" ? RotateCcw : RotateCw;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex size-10 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      aria-label={
        direction === "back" ? "Skip back 15 seconds" : "Skip forward 15 seconds"
      }
    >
      <Icon className="size-5" aria-hidden />
      <span className="absolute text-[9px] font-semibold">15</span>
    </button>
  );
}
