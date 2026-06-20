import { describe, expect, it } from "vitest";

import { buildWeeklyWorkoutSyncPlan } from "@/lib/rehab/sync-neuro-rehab-weekly-workouts";
import type { ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";

describe("sync-neuro-rehab-gym-content", () => {
  const userId = "user-1";

  it("plans Gym C content patches away from heavy leg strength", () => {
    const expected = buildWeeklyWorkoutSyncPlan(userId, []);
    const gymCTemplate = expected.inserts.find((row) => row.event_kind === "gym_c");
    expect(gymCTemplate?.description).toContain("gait control");
    expect(gymCTemplate?.description).not.toContain("Romanian deadlift");
    expect(gymCTemplate?.description).not.toContain("leg press");

    const existing: ScheduleRow[] = [
      {
        id: "c1",
        start_at: gymCTemplate!.start_at,
        end_at: gymCTemplate!.end_at,
        title: "Gym C — dynamic stability",
        description: "## Gym C — Lower body + dynamic stability",
        event_kind: "gym_c",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
    ];

    const plan = buildWeeklyWorkoutSyncPlan(userId, existing);
    const patch = plan.patches.find((row) => row.id === "c1");
    expect(patch?.title).toContain("gait control");
    expect(patch?.description).toContain("Gait rhythm");
    expect(patch?.description).not.toContain("Romanian deadlift");
  });
});
