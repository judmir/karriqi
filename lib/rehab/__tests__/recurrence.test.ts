import { describe, expect, it } from "vitest";

import {
  describeRecurrence,
  expandRule,
  parseRecurrenceRule,
  rulesEqual,
  serializeRecurrenceRule,
  type RecurrenceRule,
} from "@/lib/rehab/recurrence";

const HOUR = 60 * 60 * 1000;

function isoDates(occurrences: { startAt: string }[]): string[] {
  return occurrences.map((o) => o.startAt);
}

describe("recurrence rule parse/serialize", () => {
  it("round-trips a weekly rule with weekdays and until", () => {
    const rule: RecurrenceRule = {
      freq: "weekly",
      interval: 2,
      weekdays: [1, 3, 5],
      until: "2026-12-31",
    };
    const serialized = serializeRecurrenceRule(rule);
    expect(parseRecurrenceRule(serialized)).toEqual(rule);
  });

  it("drops weekdays for non-weekly rules", () => {
    const serialized = serializeRecurrenceRule({
      freq: "daily",
      interval: 1,
      weekdays: [1, 2],
    });
    expect(parseRecurrenceRule(serialized)).toEqual({
      freq: "daily",
      interval: 1,
      weekdays: undefined,
      until: null,
    });
  });

  it("returns null for invalid payloads", () => {
    expect(parseRecurrenceRule(null)).toBeNull();
    expect(parseRecurrenceRule("not json")).toBeNull();
    expect(parseRecurrenceRule('{"freq":"nope"}')).toBeNull();
  });

  it("clamps interval to >= 1", () => {
    const parsed = parseRecurrenceRule('{"freq":"daily","interval":0}');
    expect(parsed?.interval).toBe(1);
  });

  it("compares rules by normalized form", () => {
    expect(
      rulesEqual(
        { freq: "weekly", interval: 1, weekdays: [3, 1] },
        { freq: "weekly", interval: 1, weekdays: [1, 3] },
      ),
    ).toBe(true);
    expect(
      rulesEqual({ freq: "daily", interval: 1 }, { freq: "weekly", interval: 1 }),
    ).toBe(false);
  });
});

describe("expandRule", () => {
  it("expands a daily rule within the window", () => {
    const dtstart = new Date("2026-06-01T09:00:00.000Z");
    const occ = expandRule(
      { freq: "daily", interval: 1 },
      dtstart,
      HOUR,
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-04T23:59:59.000Z"),
    );
    expect(isoDates(occ)).toEqual([
      "2026-06-01T09:00:00.000Z",
      "2026-06-02T09:00:00.000Z",
      "2026-06-03T09:00:00.000Z",
      "2026-06-04T09:00:00.000Z",
    ]);
  });

  it("honours interval for daily rules", () => {
    const dtstart = new Date("2026-06-01T09:00:00.000Z");
    const occ = expandRule(
      { freq: "daily", interval: 2 },
      dtstart,
      HOUR,
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-06T23:59:59.000Z"),
    );
    expect(isoDates(occ)).toEqual([
      "2026-06-01T09:00:00.000Z",
      "2026-06-03T09:00:00.000Z",
      "2026-06-05T09:00:00.000Z",
    ]);
  });

  it("expands weekly rules on selected weekdays", () => {
    // 2026-06-01 is a Monday.
    const dtstart = new Date("2026-06-01T08:00:00.000Z");
    const occ = expandRule(
      { freq: "weekly", interval: 1, weekdays: [1, 3] }, // Mon, Wed
      dtstart,
      HOUR,
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-11T23:59:59.000Z"),
    );
    const days = occ.map((o) => o.startAt.slice(0, 10));
    expect(days).toEqual([
      "2026-06-01",
      "2026-06-03",
      "2026-06-08",
      "2026-06-10",
    ]);
  });

  it("stops at the until date (inclusive)", () => {
    const dtstart = new Date("2026-06-01T09:00:00.000Z");
    const occ = expandRule(
      { freq: "daily", interval: 1, until: "2026-06-03" },
      dtstart,
      HOUR,
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-30T23:59:59.000Z"),
    );
    expect(isoDates(occ)).toEqual([
      "2026-06-01T09:00:00.000Z",
      "2026-06-02T09:00:00.000Z",
      "2026-06-03T09:00:00.000Z",
    ]);
  });

  it("clips to the requested window", () => {
    const dtstart = new Date("2026-06-01T09:00:00.000Z");
    const occ = expandRule(
      { freq: "daily", interval: 1 },
      dtstart,
      HOUR,
      new Date("2026-06-10T00:00:00.000Z"),
      new Date("2026-06-12T23:59:59.000Z"),
    );
    expect(isoDates(occ)).toEqual([
      "2026-06-10T09:00:00.000Z",
      "2026-06-11T09:00:00.000Z",
      "2026-06-12T09:00:00.000Z",
    ]);
  });

  it("caps never-ending rules at the hard limit", () => {
    const dtstart = new Date("2026-01-01T09:00:00.000Z");
    const occ = expandRule(
      { freq: "daily", interval: 1 },
      dtstart,
      HOUR,
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2099-01-01T00:00:00.000Z"),
    );
    expect(occ.length).toBeLessThanOrEqual(730);
  });

  it("expands monthly and yearly rules", () => {
    const dtstart = new Date("2026-01-15T09:00:00.000Z");
    const monthly = expandRule(
      { freq: "monthly", interval: 1 },
      dtstart,
      HOUR,
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-04-30T23:59:59.000Z"),
    );
    expect(monthly.map((o) => o.startAt.slice(0, 10))).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
    ]);

    const yearly = expandRule(
      { freq: "yearly", interval: 1 },
      dtstart,
      HOUR,
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2028-12-31T23:59:59.000Z"),
    );
    expect(yearly.map((o) => o.startAt.slice(0, 10))).toEqual([
      "2026-01-15",
      "2027-01-15",
      "2028-01-15",
    ]);
  });
});

describe("describeRecurrence", () => {
  it("describes common rules", () => {
    expect(describeRecurrence(null)).toBe("Does not repeat");
    expect(describeRecurrence({ freq: "daily", interval: 1 })).toBe("Daily");
    expect(describeRecurrence({ freq: "weekly", interval: 2 })).toBe(
      "Every 2 weeks",
    );
    expect(
      describeRecurrence({ freq: "weekly", interval: 1, weekdays: [1, 3] }),
    ).toBe("Weekly on Mon, Wed");
  });
});
