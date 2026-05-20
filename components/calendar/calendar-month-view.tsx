"use client";

import { isSameMonth, isToday } from "date-fns";

import { EventChip } from "@/components/calendar/event-chip";
import {
  CalendarDayNumber,
  CalendarWeekdayHeader,
} from "@/components/calendar/calendar-header";
import { eventsForDay, monthGridDays } from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

const MAX_VISIBLE_EVENTS = 3;

export function CalendarMonthView({
  date,
  events,
  onSelectDay,
  onSelectEvent,
}: {
  date: Date;
  events: CalendarEvent[];
  onSelectDay: (day: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const days = monthGridDays(date);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <CalendarWeekdayHeader />
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const hiddenCount = dayEvents.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 border-r border-b border-border p-1.5 sm:min-h-28 sm:p-2",
                !isSameMonth(day, date) && "bg-muted/20",
              )}
            >
              <div className="mb-1 flex justify-end">
                <CalendarDayNumber
                  day={day}
                  currentMonth={date}
                  isToday={isToday(day)}
                  onClick={() => onSelectDay(day)}
                />
              </div>
              <div className="space-y-1">
                {visible.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onSelectEvent(event)}
                  />
                ))}
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="text-muted-foreground w-full px-1 text-left text-xs hover:text-foreground"
                  >
                    +{hiddenCount} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
