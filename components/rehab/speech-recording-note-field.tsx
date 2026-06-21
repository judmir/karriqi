"use client";

import { cn } from "@/lib/utils";

export function SpeechRecordingNoteField({
  value,
  onChange,
  onBlurSave,
  readOnly = false,
  disabled = false,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  onBlurSave?: () => void | Promise<void>;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  if (readOnly && !value.trim()) {
    return null;
  }

  return (
    <div className={cn("min-w-0 w-full space-y-1", className)}>
      <label className="text-xs font-medium text-white/50">
        Note <span className="font-normal text-white/35">(optional)</span>
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={() => {
          void onBlurSave?.();
        }}
        placeholder="Why this recording? e.g. baseline after a good sleep…"
        readOnly={readOnly}
        disabled={disabled || readOnly}
        rows={2}
        className={cn(
          "w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/30 focus-visible:border-white/25 disabled:opacity-60",
          readOnly && "border-transparent bg-transparent px-0 py-0 text-white/70",
        )}
      />
    </div>
  );
}
