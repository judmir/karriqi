import { describe, expect, it } from "vitest";

import {
  isRecurringRehabEvent,
  recurringEventLabel,
} from "@/lib/rehab/rehab-event-recurrence";

describe("isRecurringRehabEvent", () => {
  it("returns true when recurrence rule is set", () => {
    expect(
      isRecurringRehabEvent({
        recurrence: { freq: "weekly", interval: 1, weekdays: [1] },
      }),
    ).toBe(true);
  });

  it("returns true for series members without a parsed rule", () => {
    expect(
      isRecurringRehabEvent({
        seriesId: "series-1",
        recurrenceAt: "2026-06-16T09:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("returns false for standalone events", () => {
    expect(isRecurringRehabEvent({})).toBe(false);
  });
});

describe("recurringEventLabel", () => {
  it("describes the recurrence rule when present", () => {
    expect(
      recurringEventLabel({
        recurrence: { freq: "daily", interval: 1 },
      }),
    ).toBe("Daily");
  });

  it("falls back when only series metadata is present", () => {
    expect(
      recurringEventLabel({
        seriesId: "series-1",
        recurrenceAt: "2026-06-16T09:00:00.000Z",
      }),
    ).toBe("Recurring event");
  });
});
