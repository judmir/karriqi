import { describe, expect, it } from "vitest";

import {
  eventAppearance,
  filterEventsBySelectedCalendars,
  hexToRgba,
  resolveDefaultCalendarColor,
} from "@/lib/calendar/google-event-colors";
import { mapGoogleCalendarColorToKarriqi } from "@/lib/google-calendar/map-events";
import type { CalendarEvent, GoogleCalendarSource } from "@/types/calendar";

const sources: GoogleCalendarSource[] = [
  {
    googleCalendarId: "primary",
    summary: "Personal",
    backgroundColor: "#d50000",
    foregroundColor: "#ffffff",
    selected: true,
    primary: true,
    accessRole: "owner",
  },
  {
    googleCalendarId: "tasks",
    summary: "Tasks",
    backgroundColor: "#039be5",
    foregroundColor: "#ffffff",
    selected: false,
    primary: false,
    accessRole: "reader",
  },
];

function event(
  id: string,
  options?: { calendarId?: string; allDay?: boolean },
): CalendarEvent {
  return {
    id,
    userId: "u",
    title: "Event",
    description: null,
    startAt: "2026-06-02T10:00:00.000Z",
    endAt: "2026-06-02T11:00:00.000Z",
    allDay: options?.allDay ?? false,
    color: "blue",
    googleCalendarId: options?.calendarId,
    source: options?.calendarId ? "google" : "local",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("google calendar colors", () => {
  it("maps Google hex colors to the nearest Karriqi palette color", () => {
    expect(mapGoogleCalendarColorToKarriqi("#d50000")).toBe("red");
    expect(mapGoogleCalendarColorToKarriqi("#0b8043")).toBe("green");
  });

  it("uses the primary calendar color for all events", () => {
    expect(resolveDefaultCalendarColor(sources)).toBe("#d50000");

    const allDay = eventAppearance(event("1", { calendarId: "tasks", allDay: true }), sources);
    expect(allDay.style?.backgroundColor).toBe(hexToRgba("#d50000", 0.85));
    expect(allDay.style?.color).toBe("#ffffff");

    const timed = eventAppearance(event("2", { calendarId: "tasks" }), sources);
    expect(timed.style?.backgroundColor).toBeUndefined();
    expect(timed.style?.color).toBe("#ffffff");
    expect(timed.dotStyle?.backgroundColor).toBe("#d50000");
  });

  it("shows all events regardless of calendar selection", () => {
    const events = [event("1", { calendarId: "primary" }), event("2", { calendarId: "tasks" }), event("3")];
    const visible = filterEventsBySelectedCalendars(events, sources);
    expect(visible.map((item) => item.id)).toEqual(["1", "2", "3"]);
  });
});
