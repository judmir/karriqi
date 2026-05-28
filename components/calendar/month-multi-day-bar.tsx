"use client";

import {
  eventPastClass,
  isEventPast,
} from "@/lib/calendar/calendar-utils";
import { useCalendarSources } from "@/components/calendar/calendar-sources-context";
import type { MonthEventSegment } from "@/lib/calendar/all-day-events";
import { cn } from "@/lib/utils";

export function MonthMultiDayEventBar({
  segment,
  onSelectEvent,
}: {
  segment: MonthEventSegment;
  onSelectEvent: (event: MonthEventSegment["event"]) => void;
}) {
  const { event, startCol, span, lane, showTitle, continuesFromPriorWeek, continuesToNextWeek } =
    segment;
  const past = isEventPast(event);
  const { appearanceForEvent } = useCalendarSources();
  const appearance = appearanceForEvent(event);

  const insetLeft = continuesFromPriorWeek ? 0 : 2;
  const insetRight = continuesToNextWeek ? 0 : 2;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelectEvent(event);
      }}
      className={cn(
        "pointer-events-auto absolute box-border h-[18px] cursor-pointer truncate border px-1.5 text-left text-[11px] leading-[16px] transition-opacity sm:text-xs",
        appearance.className,
        eventPastClass(event),
        !past && "hover:opacity-90",
        continuesFromPriorWeek ? "rounded-l-none border-l-0" : "rounded-l-md",
        continuesToNextWeek ? "rounded-r-none border-r-0" : "rounded-r-md",
      )}
      style={{
        left: `calc(${(startCol / 7) * 100}% + ${insetLeft}px)`,
        width: `calc(${(span / 7) * 100}% - ${insetLeft + insetRight}px)`,
        top: `${lane * 20}px`,
        ...appearance.style,
      }}
      title={event.title}
    >
      {showTitle ? event.title : "\u00a0"}
    </button>
  );
}
