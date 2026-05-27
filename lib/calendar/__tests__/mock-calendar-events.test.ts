import { describe, expect, it } from "vitest";

import { eventsForDay, monthGridDays } from "@/lib/calendar/calendar-utils";
import { getMockCalendarEvents } from "@/lib/calendar/mock-calendar-events";
import { startOfDay } from "date-fns";

describe("mock calendar events", () => {
  it("includes events visible in the current month grid", () => {
    const events = getMockCalendarEvents();
    expect(events.length).toBeGreaterThan(0);

    const today = startOfDay(new Date());
    const monthDays = monthGridDays(today);
    const visibleCount = monthDays.reduce(
      (count, day) => count + eventsForDay(events, day).length,
      0,
    );

    expect(visibleCount).toBeGreaterThan(0);
  });
});
