"use client";

import { Download, Loader2, Mic, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { SpeechAudioPlayer } from "@/components/rehab/speech-audio-player";
import { upcomingEventScheduleLabel } from "@/lib/rehab/rehab-upcoming-utils";
import {
  createSpeechRecordingSignedUrlClient,
  downloadSpeechRecordingClient,
} from "@/lib/rehab/speech-recording-client";
import { formatSpeechDuration } from "@/lib/rehab/speech-recorder-utils";
import { cn } from "@/lib/utils";
import type { RehabPlanEvent, RehabSpeechRecording } from "@/types/rehab";

export function UpcomingSearchRecordingRow({
  event,
  recording,
  persistence,
}: {
  event: RehabPlanEvent;
  recording: RehabSpeechRecording;
  persistence: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const scheduleLabel = upcomingEventScheduleLabel(event);
  const durationLabel =
    recording.durationSeconds != null
      ? formatSpeechDuration(Math.floor(recording.durationSeconds))
      : null;

  useEffect(() => {
    if (!expanded || !persistence || signedUrl) {
      return;
    }

    let cancelled = false;

    async function loadSignedUrl() {
      const result = await createSpeechRecordingSignedUrlClient(
        recording.storagePath,
      );
      if (!cancelled && result.ok) {
        setSignedUrl(result.signedUrl);
      }
    }

    void loadSignedUrl();
    return () => {
      cancelled = true;
    };
  }, [expanded, persistence, recording.storagePath, signedUrl]);

  const handleDownload = useCallback(async () => {
    if (!persistence || downloading) {
      return;
    }

    setDownloading(true);
    try {
      const result = await downloadSpeechRecordingClient({
        storagePath: recording.storagePath,
        fileName: recording.fileName,
        mimeType: recording.mimeType,
        signedUrl,
      });
      if (!result.ok) {
        toast.error(result.message);
      }
    } finally {
      setDownloading(false);
    }
  }, [downloading, persistence, recording.fileName, recording.mimeType, recording.storagePath, signedUrl]);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 py-3 pr-3 pl-3">
      <div className="flex items-start gap-3">
        <Mic className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">Speech recording</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {event.title}
            {scheduleLabel ? ` · ${scheduleLabel}` : null}
            {durationLabel ? ` · ${durationLabel}` : null}
          </p>
          {recording.note ? (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {recording.note}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={!persistence || downloading}
            className={cn(
              "text-foreground flex size-8 items-center justify-center rounded-full bg-[#2b2b2b] text-white transition-colors hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-40",
            )}
            aria-label="Download recording as MP4"
            title="Download as MP4"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="size-3.5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            disabled={!persistence}
            className="text-foreground flex size-8 items-center justify-center rounded-full bg-[#2b2b2b] text-white transition-colors hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={expanded ? "Hide player" : "Play recording"}
          >
            {expanded ? (
              <Pause className="size-3.5 fill-current" aria-hidden />
            ) : (
              <Play className="size-3.5 fill-current" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {expanded && signedUrl ? (
        <div className="mt-2 rounded-lg bg-[#1c1c1e] p-2">
          <SpeechAudioPlayer
            srcUrl={signedUrl}
            mimeType={recording.mimeType}
            durationHint={recording.durationSeconds}
            readOnly
            compact
          />
        </div>
      ) : null}

      {expanded && persistence && !signedUrl ? (
        <p className="text-muted-foreground mt-2 text-xs">Preparing playback…</p>
      ) : null}

      {!persistence ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Sign in with sync enabled to play or download recordings.
        </p>
      ) : null}
    </div>
  );
}
