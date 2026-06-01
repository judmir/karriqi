import { describe, expect, it } from "vitest";

import { REHAB_CLINICAL_ITEMS } from "@/modules/rehab/neuro-rehab-2026/clinical-content";
import {
  findClinicalCalendarAnchors,
  isClinicalRehabEvent,
} from "@/lib/rehab/rehab-clinical-utils";
import type { RehabPlanEvent } from "@/types/rehab";

function mockEvent(
  partial: Pick<RehabPlanEvent, "id" | "eventKind" | "startAt" | "title">,
): RehabPlanEvent {
  return {
    id: partial.id,
    userId: "test",
    title: partial.title,
    description: null,
    startAt: partial.startAt,
    endAt: partial.startAt,
    allDay: true,
    color: "blue",
    source: "local",
    completedAt: null,
    eventKind: partial.eventKind,
    programId: "neuro-rehab-2026-v1",
    planWeek: null,
    createdAt: partial.startAt,
    updatedAt: partial.startAt,
  };
}

describe("clinical content", () => {
  it("keeps a short before/after checklist", () => {
    const before = REHAB_CLINICAL_ITEMS.filter((item) => item.phase === "before");
    const after = REHAB_CLINICAL_ITEMS.filter((item) => item.phase === "after");
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
    expect(before.length + after.length).toBeLessThanOrEqual(15);
  });
});

describe("isClinicalRehabEvent", () => {
  it("flags day0 and retest events", () => {
    expect(isClinicalRehabEvent("day0")).toBe(true);
    expect(isClinicalRehabEvent("retest")).toBe(true);
    expect(isClinicalRehabEvent("gym_a")).toBe(false);
  });
});

describe("findClinicalCalendarAnchors", () => {
  it("finds day0 and the latest retest", () => {
    const events = [
      mockEvent({
        id: "1",
        eventKind: "day0",
        startAt: "2026-06-08T08:00:00.000Z",
        title: "Day 0 baseline",
      }),
      mockEvent({
        id: "2",
        eventKind: "retest",
        startAt: "2026-07-06T08:00:00.000Z",
        title: "Week 4 retest",
      }),
      mockEvent({
        id: "3",
        eventKind: "retest",
        startAt: "2026-08-31T08:00:00.000Z",
        title: "Week 12 retest",
      }),
    ];

    const { day0, finalRetest } = findClinicalCalendarAnchors(events);
    expect(day0?.id).toBe("1");
    expect(finalRetest?.id).toBe("3");
  });
});
