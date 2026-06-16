import { describe, expect, it } from "vitest";

import {
  buildReschedulePatch,
  buildReschedulePatches,
  buildUniformShiftPatches,
  daysToAlignProgramStart,
  isProgramAlreadyRescheduled,
  rescheduleDayShift,
  RESCHEDULE_DEFER_TO_END_DAYS,
  RESCHEDULE_DAY0_SHIFT_DAYS,
  RESCHEDULE_UNIFORM_JUL1_TO_JUN14_DAYS,
} from "@/lib/rehab/reschedule-neuro-rehab-program";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

function row(
  partial: Partial<{
    id: string;
    start_at: string;
    end_at: string;
    event_kind: string;
    recurrence_rule: string | null;
    recurrence_at: string | null;
  }>,
) {
  return {
    id: partial.id ?? "row-1",
    start_at: partial.start_at ?? "2026-06-08T07:00:00.000Z",
    end_at: partial.end_at ?? "2026-06-08T08:00:00.000Z",
    event_kind: partial.event_kind ?? "gym_a",
    program_id: NEURO_REHAB_PROGRAM_ID,
    recurrence_rule: partial.recurrence_rule ?? null,
    recurrence_at: partial.recurrence_at ?? null,
  };
}

describe("rescheduleDayShift", () => {
  it("defers Jun 8–13 gym events to the end", () => {
    expect(
      rescheduleDayShift("2026-06-08T09:00:00.000Z", "gym_a"),
    ).toBe(RESCHEDULE_DEFER_TO_END_DAYS);
    expect(
      rescheduleDayShift("2026-06-13T21:00:00.000Z", "journal"),
    ).toBe(RESCHEDULE_DEFER_TO_END_DAYS);
  });

  it("moves Day 0 checklist to 14 Jun", () => {
    expect(rescheduleDayShift("2026-06-08T00:00:00.000Z", "day0")).toBe(
      RESCHEDULE_DAY0_SHIFT_DAYS,
    );
  });

  it("leaves Jun 14+ events on the same calendar days", () => {
    expect(rescheduleDayShift("2026-06-14T10:00:00.000Z", "recovery")).toBe(0);
    expect(rescheduleDayShift("2026-08-29T09:00:00.000Z", "gym_a")).toBe(0);
  });
});

describe("buildReschedulePatch", () => {
  it("shifts deferred rows and extends program-end recurrence", () => {
    const patch = buildReschedulePatch(
      row({
        start_at: "2026-06-08T07:40:00.000Z",
        end_at: "2026-06-08T07:43:00.000Z",
        event_kind: "stoic",
        recurrence_rule: JSON.stringify({
          freq: "daily",
          interval: 1,
          until: "2026-06-21",
        }),
      }),
    );

    expect(patch?.start_at.startsWith("2026-09-")).toBe(true);
    expect(patch?.recurrence_rule).toContain("2026-09-");
  });

  it("extends weekly masters that end on the old program date", () => {
    const patch = buildReschedulePatch(
      row({
        start_at: "2026-06-14T17:30:00.000Z",
        end_at: "2026-06-14T17:40:00.000Z",
        event_kind: "stoic",
        recurrence_rule: JSON.stringify({
          freq: "weekly",
          interval: 1,
          weekdays: [0],
          until: "2026-08-29",
        }),
      }),
    );

    expect(patch?.start_at).toBe("2026-06-14T17:30:00.000Z");
    expect(patch?.recurrence_rule).toContain("2026-09-11");
  });

  it("aligns Jul 1 cloud anchor to 14 Jun", () => {
    const rows = [
      row({
        start_at: "2026-07-01T07:00:00.000Z",
        end_at: "2026-07-01T08:00:00.000Z",
      }),
    ];
    expect(daysToAlignProgramStart(rows)).toBe(
      RESCHEDULE_UNIFORM_JUL1_TO_JUN14_DAYS,
    );
    expect(buildUniformShiftPatches(rows, RESCHEDULE_UNIFORM_JUL1_TO_JUN14_DAYS)[0]
      ?.start_at).toContain("2026-06-14");
  });

  it("detects when the program is already rescheduled", () => {
    const rows = [
      row({
        id: "day0",
        event_kind: "day0",
        start_at: "2026-06-14T00:00:00.000Z",
        end_at: "2026-06-15T00:00:00.000Z",
      }),
      row({
        id: "gym",
        start_at: "2026-09-06T07:00:00.000Z",
        end_at: "2026-09-06T08:00:00.000Z",
      }),
    ];

    expect(isProgramAlreadyRescheduled(rows)).toBe(true);
    expect(buildReschedulePatches(rows)).toHaveLength(0);
  });
});
