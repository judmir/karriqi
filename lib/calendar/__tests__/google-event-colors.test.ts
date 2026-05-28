import { describe, expect, it } from "vitest";

import {
  eventAppearance,
  filterEventsBySelectedCalendars,
  hexToRgba,
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

function event(id: string, calendarId?: string): CalendarEvent {
  return {
    id,
    userId: "u",
    title: "Event",
    description: null,
    startAt: "2026-06-02T10:00:00.000Z",
    endAt: "2026-06-02T11:00:00.000Z",
    allDay: false,
    color: "blue",
    googleCalendarId: calendarId,
    source: calendarId ? "google" : "local",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("google calendar colors", () => {
  it("maps Google hex colors to the nearest Karriqi palette color", () => {
    expect(mapGoogleCalendarColorToKarriqi("#d50000")).toBe("red");
    expect(mapGoogleCalendarColorToKarriqi("#0b8043")).toBe("green");
  });

  it("uses calendar source colors for synced events", () => {
    const appearance = eventAppearance(event("1", "primary"), sources);
    expect(appearance.style?.backgroundColor).toBe(hexToRgba("#d50000", 0.18));
    expect(appearance.style?.color).toBe("#ffffff");
  });

  it("hides events from deselected calendars", () => {
    const events = [event("1", "primary"), event("2", "tasks"), event("3")];
    const visible = filterEventsBySelectedCalendars(events, sources);
    expect(visible.map((item) => item.id)).toEqual(["1", "3"]);
  });
});
