import { describe, expect, it } from "vitest";

import {
  buildSpeechEventSyncPlan,
  expectedSpeechEvents,
} from "@/lib/rehab/sync-neuro-rehab-speech-events";
import type { ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";
import {
  SPEECH_PRACTICE_HOUR,
  SPEECH_PRACTICE_MINUTE,
} from "@/modules/rehab/neuro-rehab-2026/constants";

describe("sync-neuro-rehab-speech-events", () => {
  const userId = "user-1";

  it("expects one speech event per program day at 09:55", () => {
    const expected = expectedSpeechEvents(userId);
    expect(expected).toHaveLength(90);

    for (const row of expected) {
      const start = new Date(row.start_at);
      expect(start.getHours()).toBe(SPEECH_PRACTICE_HOUR);
      expect(start.getMinutes()).toBe(SPEECH_PRACTICE_MINUTE);
      expect(row.title).toBe("Speech practice");
    }
  });

  it("reschedules legacy afternoon speech and inserts missing days", () => {
    const existing: ScheduleRow[] = [
      {
        id: "legacy-tue",
        start_at: "2026-06-17T14:30:00+00:00",
        end_at: "2026-06-17T14:45:00+00:00",
        event_kind: "speech",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
      {
        id: "legacy-thu",
        start_at: "2026-06-19T14:30:00+00:00",
        end_at: "2026-06-19T14:45:00+00:00",
        event_kind: "speech",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
    ];

    const plan = buildSpeechEventSyncPlan(userId, existing);
    expect(plan.patches).toHaveLength(2);
    expect(plan.patches.map((patch) => patch.id).sort()).toEqual([
      "legacy-thu",
      "legacy-tue",
    ]);
    expect(plan.inserts.length).toBe(88);
    expect(plan.deleteIds).toEqual([]);
  });

  it("drops duplicate speech rows on the same day when uncompleted", () => {
    const existing: ScheduleRow[] = [
      {
        id: "keep",
        start_at: "2026-06-17T14:30:00+00:00",
        end_at: "2026-06-17T14:45:00+00:00",
        event_kind: "speech",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
        completed_at: "2026-06-17T15:00:00+00:00",
      },
      {
        id: "drop",
        start_at: "2026-06-17T15:30:00+00:00",
        end_at: "2026-06-17T15:45:00+00:00",
        event_kind: "speech",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
    ];

    const plan = buildSpeechEventSyncPlan(userId, existing);
    expect(plan.deleteIds).toEqual(["drop"]);
    expect(plan.patches.find((patch) => patch.id === "keep")).toBeDefined();
  });
});
