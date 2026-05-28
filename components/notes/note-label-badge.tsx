"use client";

import { cn } from "@/lib/utils";
import { labelColorClass, labelDotClass } from "@/lib/notes/label-styles";
import type { NoteLabel } from "@/types/notes";

export function NoteLabelBadge({
  label,
  className,
  showDot = true,
}: {
  label: NoteLabel;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        labelColorClass[label.color],
        className,
      )}
    >
      {showDot ? (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", labelDotClass[label.color])}
          aria-hidden
        />
      ) : null}
      {label.name}
    </span>
  );
}
