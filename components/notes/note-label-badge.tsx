"use client";

import { cn } from "@/lib/utils";
import { labelColorClass } from "@/lib/notes/label-styles";
import type { NoteLabel } from "@/types/notes";

export function NoteLabelBadge({
  label,
  className,
}: {
  label: NoteLabel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        labelColorClass[label.color],
        className,
      )}
    >
      {label.name}
    </span>
  );
}
