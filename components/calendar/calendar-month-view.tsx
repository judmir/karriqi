"use client";

import { isSameMonth, isToday } from "date-fns";

import {
  CalendarDayNumber,
  CalendarWeekdayHeader,
} from "@/components/calendar/calendar-header";
import {
  DraggableEventChip,
  DroppableDayCell,
} from "@/components/calendar/calendar-dnd";
import { DayEventsOverflow } from "@/components/calendar/day-events-overflow";
import { eventsForDay, monthGridDays } from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

const MAX_VISIBLE_EVENTS = 3;

export function CalendarMonthView({
  date,
  events,
  onSelectDay,
  onSelectEvent,
  onCreateEvent,
}: {
  date: Date;
  events: CalendarEvent[];
  onSelectDay: (day: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEvent: (day: Date) => void;
}) {
  const days = monthGridDays(date);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <CalendarWeekdayHeader />
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const hidden = dayEvents.slice(MAX_VISIBLE_EVENTS);

          return (
            <DroppableDayCell
              key={day.toISOString()}
              day={day}
              onClick={() => onCreateEvent(day)}
              className={cn(
                "flex min-h-0 cursor-pointer flex-col overflow-hidden border-r border-b border-border p-1 sm:p-1.5",
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
              <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {visible.map((event) => (
                  <DraggableEventChip
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onSelectEvent(event)}
                  />
                ))}
                {hidden.length > 0 ? (
                  <DayEventsOverflow
                    events={hidden}
                    onSelectEvent={onSelectEvent}
                  />
                ) : null}
              </div>
            </DroppableDayCell>
          );
        })}
      </div>
    </div>
  );
}
