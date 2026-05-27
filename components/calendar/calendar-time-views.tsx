"use client";

import { format, isToday } from "date-fns";

import {
  DraggableEventChip,
  DroppableAllDayRow,
  DroppableTimeSlot,
} from "@/components/calendar/calendar-dnd";
import {
  eventsForDay,
  formatEventTime,
  HOUR_HEIGHT_PX,
  timedEventStyle,
  VISIBLE_HOURS,
  weekDays,
} from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";
import { eventColorClasses } from "@/lib/calendar/calendar-utils";

function TimeGrid({
  day,
  events,
  onSelectEvent,
  onSelectSlot,
}: {
  day: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (day: Date, hour: number) => void;
}) {
  const dayEvents = eventsForDay(events, day);
  const allDayEvents = dayEvents.filter((event) => event.allDay);
  const timedEvents = dayEvents.filter((event) => !event.allDay);

  return (
    <div className="relative flex-1 border-r border-border last:border-r-0">
      <DroppableAllDayRow
        day={day}
        className={cn(
          "min-h-8 border-b border-border p-1.5",
          allDayEvents.length === 0 && "min-h-0 border-b-0 p-0",
        )}
      >
        {allDayEvents.length > 0 ? (
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <DraggableEventChip
                key={event.id}
                event={event}
                compact
                onClick={() => onSelectEvent(event)}
              />
            ))}
          </div>
        ) : null}
      </DroppableAllDayRow>

      <div
        className="relative"
        style={{ height: VISIBLE_HOURS.length * HOUR_HEIGHT_PX }}
      >
        {VISIBLE_HOURS.map((hour) => (
          <DroppableTimeSlot
            key={hour}
            day={day}
            hour={hour}
            aria-label={`Create event at ${format(new Date(2000, 0, 1, hour), "h a")}`}
            onClick={() => onSelectSlot(day, hour)}
            className="absolute w-full border-b border-border/60 hover:bg-muted/30"
            style={{
              top: hour * HOUR_HEIGHT_PX,
              height: HOUR_HEIGHT_PX,
            }}
          />
        ))}

        {timedEvents.map((event) => {
          const style = timedEventStyle(event, day);
          if (!style) {
            return null;
          }

          return (
            <DraggableEventChip
              key={event.id}
              event={event}
              style={style}
              className={cn(
                "absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs",
                eventColorClasses(event.color),
              )}
              onClick={() => onSelectEvent(event)}
            >
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="h-full w-full text-left"
              >
                <div className="truncate font-medium">{event.title}</div>
                <div className="truncate opacity-80">{formatEventTime(event)}</div>
              </button>
            </DraggableEventChip>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarWeekView({
  date,
  events,
  onSelectEvent,
  onSelectSlot,
}: {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (day: Date, hour: number) => void;
}) {
  const days = weekDays(date);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border">
        <div />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r border-border px-2 py-2 text-center last:border-r-0"
          >
            <div className="text-muted-foreground text-xs">{format(day, "EEE")}</div>
            <div
              className={cn(
                "mx-auto mt-1 inline-flex size-8 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] overflow-y-auto">
        <div className="border-r border-border">
          {VISIBLE_HOURS.map((hour) => (
            <div
              key={hour}
              className="text-muted-foreground border-b border-border/60 px-2 text-[0.65rem] sm:text-xs"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              {format(new Date(2000, 0, 1, hour), "h a")}
            </div>
          ))}
        </div>

        {days.map((day) => (
          <TimeGrid
            key={day.toISOString()}
            day={day}
            events={events}
            onSelectEvent={onSelectEvent}
            onSelectSlot={onSelectSlot}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarDayView({
  date,
  events,
  onSelectEvent,
  onSelectSlot,
}: {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (day: Date, hour: number) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="text-muted-foreground text-sm">{format(date, "EEEE")}</div>
        <div className="text-xl font-semibold">{format(date, "MMMM d, yyyy")}</div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)] overflow-y-auto">
        <div className="border-r border-border">
          {VISIBLE_HOURS.map((hour) => (
            <div
              key={hour}
              className="text-muted-foreground border-b border-border/60 px-2 text-xs"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              {format(new Date(2000, 0, 1, hour), "h a")}
            </div>
          ))}
        </div>

        <TimeGrid
          day={date}
          events={events}
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
        />
      </div>
    </div>
  );
}
