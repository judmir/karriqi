"use client";

import { Square } from "lucide-react";

import { formatSpeechDuration } from "@/lib/rehab/speech-recorder-utils";
import { cn } from "@/lib/utils";

const BAR_COUNT = 28;
const RECORDING_COLOR = "#ff6b5a";

export function VoiceMemoRecorderBar({
  elapsed,
  waveformSamples,
  onStop,
  className,
  compact = false,
}: {
  elapsed: number;
  waveformSamples: number[];
  onStop: () => void;
  className?: string;
  compact?: boolean;
}) {
  const bars = normalizeBars(waveformSamples, BAR_COUNT);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full bg-black/95 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur-md",
        compact ? "max-w-full" : "w-full max-w-md",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`Recording voice memo, ${formatSpeechDuration(elapsed)} elapsed`}
    >
      <div
        className={cn(
          "relative flex min-w-0 flex-1 items-end gap-[2px]",
          compact ? "h-5" : "h-6",
        )}
        aria-hidden
      >
        {bars.map((height, index) => (
          <span
            key={`bar-${index}`}
            className="w-[3px] shrink-0 rounded-full transition-[height] duration-75 ease-out"
            style={{
              height: `${Math.round(height * 100)}%`,
              backgroundColor: RECORDING_COLOR,
              opacity: 0.35 + height * 0.65,
            }}
          />
        ))}
        <span
          className="mx-0.5 w-[2px] shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: RECORDING_COLOR }}
        />
        <div className="flex min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={`dot-${index}`}
              className="size-[3px] shrink-0 rounded-full bg-white/25"
            />
          ))}
        </div>
      </div>

      <span
        className="shrink-0 text-sm font-semibold tabular-nums"
        style={{ color: RECORDING_COLOR }}
      >
        {formatSpeechDuration(elapsed)}
      </span>

      <button
        type="button"
        onClick={onStop}
        className="relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white/90 text-white transition-transform active:scale-95"
        aria-label="Stop recording"
      >
        <span
          className="absolute inset-[7px] rounded-[3px]"
          style={{ backgroundColor: RECORDING_COLOR }}
        />
        <Square className="relative size-3 fill-current opacity-0" aria-hidden />
      </button>
    </div>
  );
}

function normalizeBars(samples: number[], count: number): number[] {
  if (samples.length === 0) {
    return Array.from({ length: count }, (_, index) => 0.12 + (index % 3) * 0.04);
  }
  if (samples.length >= count) {
    return samples.slice(samples.length - count);
  }
  const padding = Array.from(
    { length: count - samples.length },
    (_, index) => 0.1 + (index % 4) * 0.03,
  );
  return [...padding, ...samples];
}
