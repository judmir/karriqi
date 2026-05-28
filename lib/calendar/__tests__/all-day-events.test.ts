import { describe, expect, it } from "vitest";

import {
  allDayLastInclusiveDay,
  eventSpansDay,
  formatAllDayDateString,
  isMultiDayAllDayEvent,
} from "@/lib/calendar/all-day-events";
import type { CalendarEvent } from "@/types/calendar";

function allDayEvent(start: string, end: string): CalendarEvent {
  return {
    id: "1",
    userId: "u",
    title: "Weekend trip",
    description: null,
    startAt: `${start}T00:00:00.000Z`,
    endAt: `${end}T00:00:00.000Z`,
    allDay: true,
    color: "green",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("all-day event ranges", () => {
  it("treats Google exclusive end dates as last inclusive day minus one", () => {
    const event = allDayEvent("2026-06-02", "2026-06-04");
    expect(formatAllDayDateString(allDayLastInclusiveDay(event))).toBe(
      "2026-06-03",
    );
    expect(isMultiDayAllDayEvent(event)).toBe(true);
    expect(eventSpansDay(event, new Date("2026-06-02"))).toBe(true);
    expect(eventSpansDay(event, new Date("2026-06-03"))).toBe(true);
    expect(eventSpansDay(event, new Date("2026-06-04"))).toBe(false);
  });
});
