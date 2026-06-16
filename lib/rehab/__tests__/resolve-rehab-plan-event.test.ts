import { describe, expect, it } from "vitest";

import {
  occurrenceId,
} from "@/lib/rehab/expand-rehab-events";
import { resolveRehabPlanEventById } from "@/lib/rehab/resolve-rehab-plan-event";
import type { RehabPlanEvent } from "@/types/rehab";

function makeEvent(overrides: Partial<RehabPlanEvent> = {}): RehabPlanEvent {
  return {
    id: "event-1",
    userId: "user-1",
    title: "Walk",
    description: null,
    startAt: "2026-06-16T09:00:00.000Z",
    endAt: "2026-06-16T09:30:00.000Z",
    allDay: false,
    color: "blue",
    source: "local",
    completedAt: null,
    eventKind: "custom",
    programId: null,
    planWeek: null,
    speechRecordings: [],
    seriesId: null,
    recurrence: null,
    recurrenceAt: null,
    recurrenceCancelled: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveRehabPlanEventById", () => {
  it("returns a direct store match", () => {
    const event = makeEvent();
    expect(resolveRehabPlanEventById([event], event.id)).toEqual(event);
  });

  it("resolves a virtual recurring occurrence", () => {
    const master = makeEvent({
      id: "master-1",
      recurrence: {
        freq: "daily",
        interval: 1,
      },
      seriesId: "master-1",
    });

    const id = occurrenceId("master-1", "2026-06-16T09:00:00.000Z");
    const resolved = resolveRehabPlanEventById([master], id);

    expect(resolved?.id).toBe(id);
    expect(resolved?.title).toBe("Walk");
  });
});
