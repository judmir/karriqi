"use client";

import { format, isSameMonth, isToday } from "date-fns";

import {
  CalendarDayNumber,
  CalendarWeekdayHeader,
} from "@/components/calendar/calendar-header";
import {
  DraggableEventChip,
  DroppableDayCell,
} from "@/components/calendar/calendar-dnd";
import { DayEventsOverflow } from "@/components/calendar/day-events-overflow";
import { MonthMultiDayEventBar } from "@/components/calendar/month-multi-day-bar";
import {
  isMultiDayAllDayEvent,
  layoutMonthMultiDaySegments,
  maxSegmentLane,
  monthGridWeeks,
} from "@/lib/calendar/all-day-events";
import { eventsForDay, monthGridDays } from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

const MAX_VISIBLE_EVENTS = 3;
const MULTI_DAY_LANE_HEIGHT = 20;

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
  const gridDays = monthGridDays(date);
  const weeks = monthGridWeeks(gridDays);
  const multiDaySegments = layoutMonthMultiDaySegments(events, weeks);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <CalendarWeekdayHeader />
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-6">
        {weeks.map((weekDays, weekIndex) => {
          const weekSegments = multiDaySegments.filter(
            (segment) => segment.weekIndex === weekIndex,
          );
          const maxLane = maxSegmentLane(multiDaySegments, weekIndex);
          const multiDayLaneCount = maxLane + 1;
          const overlayHeight =
            multiDayLaneCount > 0 ? multiDayLaneCount * MULTI_DAY_LANE_HEIGHT : 0;

          return (
            <div
              key={weekDays[0]!.toISOString()}
              className="relative grid min-h-0 grid-cols-7 border-b border-border last:border-b-0"
            >
              {weekDays.map((day) => {
                const dayEvents = eventsForDay(events, day).filter(
                  (event) => !isMultiDayAllDayEvent(event),
                );
                const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                const hidden = dayEvents.slice(MAX_VISIBLE_EVENTS);

                return (
                  <DroppableDayCell
                    key={day.toISOString()}
                    day={day}
                    className={cn(
                      "relative flex min-h-0 flex-col overflow-hidden border-r border-border p-1 last:border-r-0 sm:p-1.5",
                      !isSameMonth(day, date) && "bg-muted/20",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`Create event on ${format(day, "MMMM d")}`}
                      className="absolute inset-0 z-0 cursor-default"
                      onClick={() => onCreateEvent(day)}
                    />
                    <div className="pointer-events-none relative z-[1] mb-1 flex justify-end">
                      <CalendarDayNumber
                        day={day}
                        currentMonth={date}
                        isToday={isToday(day)}
                        className="pointer-events-auto"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectDay(day);
                        }}
                      />
                    </div>
                    <div
                      className="pointer-events-none relative z-[1] min-h-0 flex-1 space-y-0.5 overflow-hidden"
                      style={{ paddingTop: overlayHeight }}
                    >
                      {visible.map((event) => (
                        <div key={event.id} className="pointer-events-auto">
                          <DraggableEventChip
                            event={event}
                            compact
                            onClick={() => onSelectEvent(event)}
                          />
                        </div>
                      ))}
                      {hidden.length > 0 ? (
                        <div className="pointer-events-auto">
                          <DayEventsOverflow
                            events={hidden}
                            onSelectEvent={onSelectEvent}
                          />
                        </div>
                      ) : null}
                    </div>
                  </DroppableDayCell>
                );
              })}

              {overlayHeight > 0 ? (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 overflow-visible px-0.5 sm:px-1"
                  style={{ top: "1.75rem", height: overlayHeight }}
                >
                  {weekSegments.map((segment) => (
                    <MonthMultiDayEventBar
                      key={`${segment.event.id}-${segment.startCol}-${segment.weekIndex}`}
                      segment={segment}
                      onSelectEvent={onSelectEvent}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
