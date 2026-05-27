"use client";

import {
  eventColorClasses,
  formatEventChipLabel,
} from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

export function EventChip({
  event,
  compact = false,
  className,
  onClick,
}: {
  event: CalendarEvent;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const label = compact ? formatEventChipLabel(event) : event.title;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "w-full truncate rounded-md border px-1.5 text-left text-xs transition-opacity hover:opacity-90",
        compact ? "py-0.5" : "py-1",
        eventColorClasses(event.color),
        className,
      )}
    >
      {label}
    </button>
  );
}
