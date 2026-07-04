import { describe, expect, it } from "vitest";

import { calendarViewRange } from "@/lib/calendar/calendar-view-range";

describe("calendarViewRange", () => {
  it("month view includes trailing/leading days from adjacent months in the grid", () => {
    const july2026 = new Date(2026, 6, 15);
    const { start, end } = calendarViewRange("month", july2026);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5);
    expect(start.getDate()).toBe(29);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(7);
    expect(end.getDate()).toBe(2);
  });
});
