import { describe, expect, it } from "vitest";

import {
  buildWeeklyScheduleExcessDeleteIds,
  buildWeeklySchedulePatches,
  type ScheduleRow,
} from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";

describe("remap-neuro-rehab-weekly-schedule", () => {
  it("places plan week 2 gym_b on Saturday of that week (UTC)", () => {
    const rows: ScheduleRow[] = [
      {
        id: "gym-b-w2",
        start_at: "2026-06-14T09:00:00+00:00",
        end_at: "2026-06-14T10:00:00+00:00",
        event_kind: "gym_b",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 2,
      },
      {
        id: "gym-a-w2",
        start_at: "2026-06-17T09:00:00+00:00",
        end_at: "2026-06-17T10:00:00+00:00",
        event_kind: "gym_a",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 2,
      },
      {
        id: "gym-c-w2",
        start_at: "2026-06-20T09:00:00+00:00",
        end_at: "2026-06-20T10:00:00+00:00",
        event_kind: "gym_c",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 2,
      },
    ];

    const patches = buildWeeklySchedulePatches(rows);
    const gymB = patches.find((patch) => patch.id === "gym-b-w2");
    expect(gymB?.start_at).toBe("2026-06-27T09:00:00.000Z");
    const gymA = patches.find((patch) => patch.id === "gym-a-w2");
    expect(gymA?.start_at).toBe("2026-06-24T09:00:00.000Z");
  });

  it("drops extra gym/run rows beyond 3 gyms and 5 runs per plan week", () => {
    const rows: ScheduleRow[] = [
      ...["gym_a", "gym_b", "gym_c", "gym_d"].map((kind, index) => ({
        id: `gym-${index}`,
        start_at: `2026-08-1${index}T09:00:00+00:00`,
        end_at: `2026-08-1${index}T10:00:00+00:00`,
        event_kind: kind,
        program_id: "neuro-rehab-2026-v1",
        plan_week: 9,
      })),
      ...[0, 1, 2, 3, 4, 5].map((index) => ({
        id: `run-${index}`,
        start_at: `2026-08-2${index}T09:00:00+00:00`,
        end_at: `2026-08-2${index}T10:00:00+00:00`,
        event_kind: "run_walk",
        program_id: "neuro-rehab-2026-v1",
        plan_week: 9,
      })),
    ];

    const deleteIds = buildWeeklyScheduleExcessDeleteIds(rows);
    expect(deleteIds).toContain("gym-3");
    expect(deleteIds).toContain("run-5");
    expect(deleteIds).toHaveLength(2);
  });
});
