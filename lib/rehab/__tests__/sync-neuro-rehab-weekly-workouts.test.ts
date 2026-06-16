import { describe, expect, it } from "vitest";

import {
  buildWeeklyWorkoutSyncPlan,
  expectedWeeklyWorkouts,
} from "@/lib/rehab/sync-neuro-rehab-weekly-workouts";
import type { ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";

describe("sync-neuro-rehab-weekly-workouts", () => {
  const userId = "user-1";

  it("targets gym on Wed/Sat/Sun and run on Mon/Tue/Thu/Fri from the seed template", () => {
    const expected = expectedWeeklyWorkouts(userId);
    const week1 = expected.filter((row) => row.plan_week === 1);
    expect(week1.find((row) => row.event_kind === "gym_a")?.start_at).toContain(
      "2026-06-17",
    );
    expect(week1.find((row) => row.event_kind === "gym_b")?.start_at).toContain(
      "2026-06-20",
    );
    expect(week1.find((row) => row.event_kind === "gym_c")?.start_at).toContain(
      "2026-06-14",
    );
    expect(week1.filter((row) => row.event_kind === "run_walk")).toHaveLength(4);
  });

  it("moves legacy Mon–Sat workouts onto the new weekdays and drops gym_d", () => {
    const existing: ScheduleRow[] = [
      {
        id: "a",
        start_at: "2026-06-08T09:00:00+00:00",
        end_at: "2026-06-08T10:00:00+00:00",
        event_kind: "gym_a",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
      {
        id: "b",
        start_at: "2026-06-10T09:00:00+00:00",
        end_at: "2026-06-10T10:00:00+00:00",
        event_kind: "gym_b",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
      {
        id: "c",
        start_at: "2026-06-12T09:00:00+00:00",
        end_at: "2026-06-12T10:00:00+00:00",
        event_kind: "gym_c",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
      {
        id: "d",
        start_at: "2026-06-13T09:00:00+00:00",
        end_at: "2026-06-13T10:00:00+00:00",
        event_kind: "gym_d",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
      {
        id: "r1",
        start_at: "2026-06-09T09:00:00+00:00",
        end_at: "2026-06-09T10:00:00+00:00",
        event_kind: "run_walk",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
      {
        id: "r2",
        start_at: "2026-06-11T09:00:00+00:00",
        end_at: "2026-06-11T10:00:00+00:00",
        event_kind: "run_walk",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 1,
      },
    ];

    const plan = buildWeeklyWorkoutSyncPlan(userId, existing);
    expect(plan.deleteIds).toContain("d");
    expect(plan.patches.find((patch) => patch.id === "a")?.start_at).toContain(
      "2026-06-17",
    );
    expect(plan.inserts.length + plan.patches.length).toBeGreaterThan(0);
  });
});
