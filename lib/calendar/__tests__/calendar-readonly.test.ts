import { afterEach, describe, expect, it } from "vitest";

import { isCalendarReadOnly } from "@/lib/calendar/calendar-readonly";

describe("isCalendarReadOnly", () => {
  const previous = process.env.CALENDAR_READONLY;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.CALENDAR_READONLY;
    } else {
      process.env.CALENDAR_READONLY = previous;
    }
  });

  it("defaults to readonly when unset", () => {
    delete process.env.CALENDAR_READONLY;
    expect(isCalendarReadOnly()).toBe(true);
  });

  it("can be disabled with CALENDAR_READONLY=0", () => {
    process.env.CALENDAR_READONLY = "0";
    expect(isCalendarReadOnly()).toBe(false);
  });
});
