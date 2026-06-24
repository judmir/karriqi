import { describe, expect, it } from "vitest";

import { parseStoicExerciseIdFromDescription } from "@/lib/rehab/stoic-path-event-metadata";
import { buildStoicPathEventSyncPlan } from "@/lib/rehab/sync-neuro-rehab-stoic-path-events";
import { STOIC_REHAB_EXERCISES } from "@/modules/rehab/neuro-rehab-2026/stoic-rehab-exercises";

describe("buildStoicPathEventSyncPlan", () => {
  const userId = "user-1";

  it("inserts all 252 exercises when none exist yet", () => {
    const plan = buildStoicPathEventSyncPlan(userId, [], new Map());
    expect(plan.inserts).toHaveLength(STOIC_REHAB_EXERCISES.length);
    expect(plan.patches).toHaveLength(0);
    expect(plan.completionPatches).toHaveLength(0);
  });

  it("backfills completed_at from rehab_stoic_completions", () => {
    const exercise = STOIC_REHAB_EXERCISES[0]!;
    const completedAt = "2026-06-24T10:00:00.000Z";
    const plan = buildStoicPathEventSyncPlan(
      userId,
      [
        {
          id: "row-1",
          title: exercise.title,
          description: `prompt\n\n<!-- karriqi-stoic-exercise-id:${exercise.id} -->`,
          start_at: "2026-06-14T05:00:00.000Z",
          end_at: "2026-06-14T05:03:00.000Z",
          event_kind: "stoic",
          program_id: "neuro-rehab-2026-v1",
          plan_week: 1,
          completed_at: null,
          recurrence_rule: null,
        },
      ],
      new Map([[exercise.id, completedAt]]),
    );

    expect(plan.inserts.length).toBe(STOIC_REHAB_EXERCISES.length - 1);
    expect(plan.completionPatches).toEqual([
      { id: "row-1", completed_at: completedAt },
    ]);
  });

  it("embeds exercise ids in generated inserts", () => {
    const plan = buildStoicPathEventSyncPlan(userId, [], new Map());
    const first = plan.inserts[0];
    expect(
      parseStoicExerciseIdFromDescription(first?.description ?? null),
    ).toBeTruthy();
  });
});
