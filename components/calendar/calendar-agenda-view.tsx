"use client";

import { format, startOfDay } from "date-fns";

import {
  eventDotClass,
  eventsForDay,
  eventsInRange,
  formatEventTime,
  monthGridDays,
} from "@/lib/calendar/calendar-utils";
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
            {dayEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="hover:bg-muted/20 flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      eventDotClass(event.color),
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="text-muted-foreground text-sm">
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
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
