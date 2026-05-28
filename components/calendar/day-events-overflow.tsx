"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EventChip } from "@/components/calendar/event-chip";
import { formatEventTime } from "@/lib/calendar/calendar-utils";
import type { CalendarEvent } from "@/types/calendar";

export function DayEventsOverflow({
  events,
  onSelectEvent,
}: {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground w-full px-1 text-left text-xs"
          />
        }
      >
        + {events.length} more
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <ul className="space-y-1">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="hover:bg-muted/50 w-full cursor-pointer rounded-md p-1.5 text-left"
              >
                <EventChip event={event} compact className="pointer-events-none" />
                <div className="text-muted-foreground mt-0.5 px-1.5 text-[0.65rem]">
                  {formatEventTime(event)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
