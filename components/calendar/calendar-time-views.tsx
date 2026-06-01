"use client";

import { format, isToday } from "date-fns";

import {
  DraggableEventChip,
  DroppableAllDayRow,
  DroppableTimeSlot,
} from "@/components/calendar/calendar-dnd";
import { MonthMultiDayEventBar } from "@/components/calendar/month-multi-day-bar";
import {
  isMultiDayAllDayEvent,
  layoutMonthMultiDaySegments,
  maxSegmentLane,
} from "@/lib/calendar/all-day-events";
import {
  eventsForDay,
  eventPastClass,
  formatEventTime,
  HOUR_HEIGHT_PX,
  timedEventStyle,
  VISIBLE_HOURS,
  weekDays,
} from "@/lib/calendar/calendar-utils";
import { useCalendarSources } from "@/components/calendar/calendar-sources-context";
import { RehabEventKindIcon } from "@/components/rehab/rehab-event-kind-icon";
import { getRehabEventKind } from "@/lib/rehab/rehab-event-kind-visual";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

const MULTI_DAY_LANE_HEIGHT = 20;

function WeekAllDaySection({
  days,
  events,
  onSelectEvent,
}: {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const segments = layoutMonthMultiDaySegments(events, [days]);
  const maxLane = maxSegmentLane(segments, 0);
  const multiDayLaneCount = maxLane + 1;
  const hasSingleDayAllDay = days.some((day) =>
    eventsForDay(events, day).some(
      (event) => event.allDay && !isMultiDayAllDayEvent(event),
    ),
  );
  const minHeight =
    multiDayLaneCount > 0
      ? multiDayLaneCount * MULTI_DAY_LANE_HEIGHT
      : hasSingleDayAllDay
        ? MULTI_DAY_LANE_HEIGHT
        : 0;

  if (minHeight === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border">
      <div className="border-r border-border" />
      <div className="relative col-span-7 grid grid-cols-7">
        {days.map((day) => {
          const singleDayAllDay = eventsForDay(events, day).filter(
            (event) => event.allDay && !isMultiDayAllDayEvent(event),
          );

          return (
            <DroppableAllDayRow
              key={day.toISOString()}
              day={day}
              className="relative min-h-0 border-r border-border p-1 last:border-r-0"
            >
              <div
                className="space-y-0.5"
                style={{ paddingTop: multiDayLaneCount * MULTI_DAY_LANE_HEIGHT }}
              >
                {singleDayAllDay.map((event) => (
                  <DraggableEventChip
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onSelectEvent(event)}
                  />
                ))}
              </div>
            </DroppableAllDayRow>
          );
        })}

        {multiDayLaneCount > 0 ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1 z-10 overflow-visible px-0.5"
            style={{ height: multiDayLaneCount * MULTI_DAY_LANE_HEIGHT }}
          >
            {segments.map((segment) => (
              <MonthMultiDayEventBar
                key={`${segment.event.id}-${segment.startCol}`}
                segment={segment}
                onSelectEvent={onSelectEvent}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TimeGrid({
  day,
  events,
  onSelectEvent,
  onSelectSlot,
  includeAllDayRow = true,
}: {
  day: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot?: (day: Date, hour: number) => void;
  includeAllDayRow?: boolean;
}) {
  const dayEvents = eventsForDay(events, day);
  const allDayEvents = dayEvents.filter((event) => event.allDay);
  const timedEvents = dayEvents.filter((event) => !event.allDay);
  const { appearanceForEvent } = useCalendarSources();

  return (
    <div className="relative flex-1 border-r border-border last:border-r-0">
      {includeAllDayRow ? (
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
      ) : null}

      <div
        className="relative"
        style={{ height: VISIBLE_HOURS.length * HOUR_HEIGHT_PX }}
      >
        {VISIBLE_HOURS.map((hour) => (
          <DroppableTimeSlot
            key={hour}
            day={day}
            hour={hour}
            aria-label={
              onSelectSlot
                ? `Create event at ${format(new Date(2000, 0, 1, hour), "h a")}`
                : undefined
            }
            onClick={
              onSelectSlot ? () => onSelectSlot(day, hour) : undefined
            }
            className={cn(
              "absolute w-full border-b border-border/60",
              onSelectSlot
                ? "cursor-default hover:bg-muted/30"
                : "pointer-events-none",
            )}
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

          const appearance = appearanceForEvent(event, "block");
          const rehabKind = getRehabEventKind(event);

          return (
            <DraggableEventChip
              key={event.id}
              event={event}
              style={{ ...style, ...appearance.style }}
              className={cn(
                "absolute inset-x-1 cursor-pointer overflow-hidden rounded-md border-0 px-1.5 py-0.5 text-left text-xs text-white",
                appearance.className,
                eventPastClass(event),
              )}
              onClick={() => onSelectEvent(event)}
            >
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="flex h-full w-full cursor-pointer items-start gap-1.5 text-left text-white"
              >
                {rehabKind ? (
                  <RehabEventKindIcon
                    event={event}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{event.title}</div>
                  <div className="truncate text-white/80">
                    {formatEventTime(event)}
                  </div>
                </div>
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
  onSelectSlot?: (day: Date, hour: number) => void;
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

      <WeekAllDaySection
        days={days}
        events={events}
        onSelectEvent={onSelectEvent}
      />

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
            includeAllDayRow={false}
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
  onSelectSlot?: (day: Date, hour: number) => void;
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
