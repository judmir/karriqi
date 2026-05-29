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
        "w-full cursor-pointer truncate rounded-md text-left text-xs text-white transition-opacity",
        event.allDay ? "border px-1.5" : "flex items-center gap-1.5 px-0",
        compact ? "py-0.5" : "py-1",
        appearance.className,
        eventPastClass(event),
        !past && "hover:opacity-90",
        className,
      )}
      style={appearance.style}
    >
      {!event.allDay ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={appearance.dotStyle}
        />
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
