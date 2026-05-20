"use client";

import { cn } from "@/lib/utils";
import { eventColorClasses } from "@/lib/calendar/calendar-utils";
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
      {event.title}
    </button>
  );
}
