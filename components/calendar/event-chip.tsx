"use client";

import {
  eventPastClass,
  formatEventChipLabel,
  isEventPast,
} from "@/lib/calendar/calendar-utils";
import { useCalendarSources } from "@/components/calendar/calendar-sources-context";
import { RehabEventKindIcon } from "@/components/rehab/rehab-event-kind-icon";
import { getRehabEventKind } from "@/lib/rehab/rehab-event-kind-visual";
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
  const rehabKind = getRehabEventKind(event);

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
        event.allDay && rehabKind && "flex items-center gap-1.5",
        compact ? "py-0.5" : "py-1",
        appearance.className,
        eventPastClass(event),
        !past && "hover:opacity-90",
        className,
      )}
      style={appearance.style}
    >
      {rehabKind ? (
        <RehabEventKindIcon event={event} size="sm" className="shrink-0" />
      ) : !event.allDay ? (
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
