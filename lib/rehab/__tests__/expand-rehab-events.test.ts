import { describe, expect, it } from "vitest";

import {
  expandRehabEvents,
  occurrenceId,
  parseOccurrenceId,
} from "@/lib/rehab/expand-rehab-events";
import type { RecurrenceRule } from "@/lib/rehab/recurrence";
import type { RehabPlanEvent } from "@/types/rehab";

function makeEvent(overrides: Partial<RehabPlanEvent>): RehabPlanEvent {
  return {
    id: "evt",
    userId: "u1",
    title: "Task",
    description: null,
    startAt: "2026-06-01T09:00:00.000Z",
    endAt: "2026-06-01T10:00:00.000Z",
    allDay: false,
    color: "blue",
    source: "local",
    completedAt: null,
    eventKind: "custom",
    programId: null,
    planWeek: null,
    seriesId: null,
    recurrence: null,
    recurrenceAt: null,
    recurrenceCancelled: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const dailyRule: RecurrenceRule = { freq: "daily", interval: 1 };
const WIN_START = new Date("2026-06-01T00:00:00.000Z");
const WIN_END = new Date("2026-06-05T23:59:59.000Z");

describe("occurrenceId helpers", () => {
  it("round-trips master id and occurrence time", () => {
    const id = occurrenceId("master-1", "2026-06-03T09:00:00.000Z");
    const parsed = parseOccurrenceId(id);
    expect(parsed?.masterId).toBe("master-1");
    expect(parsed?.occurrenceMs).toBe(
      new Date("2026-06-03T09:00:00.000Z").getTime(),
    );
  });

  it("returns null for non-occurrence ids", () => {
    expect(parseOccurrenceId("plain-uuid")).toBeNull();
  });
});

describe("expandRehabEvents", () => {
  it("passes standalone events through when they overlap the window", () => {
    const standalone = makeEvent({ id: "s1" });
    const outside = makeEvent({
      id: "s2",
      startAt: "2026-07-01T09:00:00.000Z",
      endAt: "2026-07-01T10:00:00.000Z",
    });
    const result = expandRehabEvents([standalone, outside], WIN_START, WIN_END);
    expect(result.map((e) => e.id)).toEqual(["s1"]);
  });

  it("expands a daily master into virtual occurrences", () => {
    const master = makeEvent({
      id: "m1",
      seriesId: "m1",
      recurrence: dailyRule,
    });
    const result = expandRehabEvents([master], WIN_START, WIN_END);
    expect(result).toHaveLength(5);
    expect(result.every((e) => e.recurrenceMasterId === "m1")).toBe(true);
    expect(result[0].id).toBe(occurrenceId("m1", "2026-06-01T09:00:00.000Z"));
    // Virtual occurrences keep the rule (for display) but are flagged occurrences.
    expect(result[0].recurrence).toEqual(dailyRule);
    expect(result[0].recurrenceAt).toBe("2026-06-01T09:00:00.000Z");
  });

  it("applies an override row instead of the virtual occurrence", () => {
    const master = makeEvent({
      id: "m1",
      seriesId: "m1",
      recurrence: dailyRule,
    });
    const override = makeEvent({
      id: "o1",
      seriesId: "m1",
      recurrence: null,
      recurrenceAt: "2026-06-03T09:00:00.000Z",
      title: "Edited occurrence",
      startAt: "2026-06-03T11:00:00.000Z",
      endAt: "2026-06-03T12:00:00.000Z",
    });
    const result = expandRehabEvents([master, override], WIN_START, WIN_END);
    expect(result).toHaveLength(5);
    const edited = result.find((e) => e.id === "o1");
    expect(edited?.title).toBe("Edited occurrence");
    // No virtual occurrence for the overridden date.
    expect(
      result.some(
        (e) => e.id === occurrenceId("m1", "2026-06-03T09:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("skips cancelled occurrences (EXDATE)", () => {
    const master = makeEvent({
      id: "m1",
      seriesId: "m1",
      recurrence: dailyRule,
    });
    const cancelled = makeEvent({
      id: "x1",
      seriesId: "m1",
      recurrence: null,
      recurrenceAt: "2026-06-02T09:00:00.000Z",
      recurrenceCancelled: true,
    });
    const result = expandRehabEvents([master, cancelled], WIN_START, WIN_END);
    expect(result).toHaveLength(4);
    expect(result.some((e) => e.id === "x1")).toBe(false);
    expect(
      result.some(
        (e) => e.id === occurrenceId("m1", "2026-06-02T09:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("suppresses old virtual occurrences beyond the overdue lookback", () => {
    const master = makeEvent({
      id: "m1",
      seriesId: "m1",
      recurrence: dailyRule,
      startAt: "2026-01-01T09:00:00.000Z",
      endAt: "2026-01-01T10:00:00.000Z",
    });
    // Window starts 2026-06-01; lookback 14 days -> floor 2026-05-18.
    const result = expandRehabEvents([master], WIN_START, WIN_END, {
      overdueLookbackDays: 14,
    });
    expect(result.length).toBe(5);
    expect(
      result.every((e) => new Date(e.startAt) >= new Date("2026-05-18")),
    ).toBe(true);
  });
});
