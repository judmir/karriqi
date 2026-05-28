"use client";

import {
  eventPastClass,
  formatEventChipLabel,
  isEventPast,
} from "@/lib/calendar/calendar-utils";
import { useCalendarSources } from "@/components/calendar/calendar-sources-context";
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
  const past = isEventPast(event);
  const { appearanceForEvent } = useCalendarSources();
  const appearance = appearanceForEvent(event);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "w-full cursor-pointer truncate rounded-md border px-1.5 text-left text-xs transition-opacity",
        compact ? "py-0.5" : "py-1",
        appearance.className,
        eventPastClass(event),
        !past && "hover:opacity-90",
        className,
      )}
      style={appearance.style}
    >
      {label}
    </button>
  );
}
