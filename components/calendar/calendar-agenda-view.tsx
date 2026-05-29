"use client";

import { format, startOfDay } from "date-fns";

import {
  eventPastClass,
  eventsForDay,
  eventsInRange,
  formatEventTime,
  monthGridDays,
} from "@/lib/calendar/calendar-utils";
import { useCalendarSources } from "@/components/calendar/calendar-sources-context";
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
              return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className={cn(
                    "hover:bg-muted/20 flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left text-white transition-colors",
                    eventPastClass(event),
                  )}
                >
                  <span
                    aria-hidden
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={appearance.dotStyle}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{event.title}</div>
                    <div className="text-sm text-white/70">
                      {formatEventTime(event)}
                    </div>
                    {event.description ? (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {event.description}
                      </p>
                    ) : null}
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
