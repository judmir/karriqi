import { describe, expect, it } from "vitest";

import {
  parseTodayAddSectionId,
  rehabTodaySectionForSchedule,
} from "@/lib/rehab/rehab-today-utils";

describe("rehabTodaySectionForSchedule", () => {
  it("maps all-day tasks to all_day", () => {
    expect(
      rehabTodaySectionForSchedule("2026-06-01T00:00:00.000Z", true),
    ).toBe("all_day");
  });

  it("maps hours to morning, afternoon, and evening", () => {
    expect(
      rehabTodaySectionForSchedule(
        new Date(2026, 5, 1, 9, 0, 0, 0).toISOString(),
        false,
      ),
    ).toBe("morning");
    expect(
      rehabTodaySectionForSchedule(
        new Date(2026, 5, 1, 12, 0, 0, 0).toISOString(),
        false,
      ),
    ).toBe("afternoon");
    expect(
      rehabTodaySectionForSchedule(
        new Date(2026, 5, 1, 20, 0, 0, 0).toISOString(),
        false,
      ),
    ).toBe("evening");
  });
});

describe("parseTodayAddSectionId", () => {
  it("reads today section ids", () => {
    expect(parseTodayAddSectionId("today-evening")).toBe("evening");
    expect(parseTodayAddSectionId("today-completed")).toBeNull();
    expect(parseTodayAddSectionId("upcoming-foo")).toBeNull();
  });
});
