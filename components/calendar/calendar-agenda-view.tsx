"use client";

import { format, startOfDay } from "date-fns";

import {
  eventPastClass,
  eventsForDay,
  eventsInRange,
  formatEventTime,
  isEventPast,
  monthGridDays,
} from "@/lib/calendar/calendar-utils";
import { getEventDescriptionPlainText } from "@/lib/calendar/event-subtasks";
import { useCalendarSources } from "@/components/calendar/calendar-sources-context";
import { RehabEventKindIcon } from "@/components/rehab/rehab-event-kind-icon";
import {
  getRehabEventKind,
  getRehabEventStatus,
  rehabEventStatusSurfaceClass,
} from "@/lib/rehab/rehab-event-kind-visual";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

export function CalendarAgendaView({
  date,
  events,
  onSelectEvent,
}: {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const monthDays = monthGridDays(date).filter(
    (day) => day.getMonth() === date.getMonth(),
  );
  const rangeStart = monthDays[0] ?? startOfDay(date);
  const rangeEnd = monthDays[monthDays.length - 1] ?? startOfDay(date);
  const monthEvents = eventsInRange(events, rangeStart, rangeEnd);
  const { appearanceForEvent } = useCalendarSources();

  const grouped = monthDays
    .map((day) => ({
      day,
      events: eventsForDay(monthEvents, day),
    }))
    .filter((group) => group.events.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No events scheduled for {format(date, "MMMM yyyy")}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-border bg-card">
      {grouped.map(({ day, events: dayEvents }) => (
        <section
          key={day.toISOString()}
          className="border-b border-border last:border-b-0"
        >
          <div className="bg-muted/30 px-4 py-2 text-sm font-medium">
            {format(day, "EEEE, MMMM d")}
          </div>
          <ul className="divide-y divide-border">
            {dayEvents.map((event) => {
              const appearance = appearanceForEvent(event);
              const rehabKind = getRehabEventKind(event);
              const statusSurface = rehabEventStatusSurfaceClass(
                getRehabEventStatus(event, isEventPast(event)),
              );
              return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
                    statusSurface ??
                      cn("hover:bg-muted/20 text-white", eventPastClass(event)),
                  )}
                >
                  {rehabKind ? (
                    <RehabEventKindIcon event={event} size="md" className="mt-0.5" />
                  ) : (
                    <span
                      aria-hidden
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={appearance.dotStyle}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="text-sm opacity-70">
                      {formatEventTime(event)}
                    </div>
            {(() => {
              const plainDescription = getEventDescriptionPlainText(event.description);
              return plainDescription ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {plainDescription}
                </p>
              ) : null;
            })()}
                  </div>
                </button>
              </li>
            );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
