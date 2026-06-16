import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEventInsert } from "@/types/rehab";

import type { SchedulePatch, ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";

const WORKOUT_KINDS = [
  "gym_a",
  "gym_b",
  "gym_c",
  "gym_d",
  "run_walk",
] as const;

function isWorkoutKind(kind: string): boolean {
  return (WORKOUT_KINDS as readonly string[]).includes(kind);
}

function isGymKind(kind: string): boolean {
  return kind === "gym_a" || kind === "gym_b" || kind === "gym_c" || kind === "gym_d";
}

export function expectedWeeklyWorkouts(
  userId: string,
): RehabPlanEventInsert[] {
  return generateNeuroRehabProgramEvents(userId).filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID &&
      isWorkoutKind(row.event_kind) &&
      row.plan_week != null &&
      row.plan_week <= 12,
  );
}

export type WeeklyWorkoutSyncPlan = {
  patches: SchedulePatch[];
  inserts: RehabPlanEventInsert[];
  deleteIds: string[];
};

/** Align gym/run rows to the seed template: gym Wed/Sat/Sun, run Mon/Tue/Thu/Fri. */
export function buildWeeklyWorkoutSyncPlan(
  userId: string,
  existing: ScheduleRow[],
): WeeklyWorkoutSyncPlan {
  const expected = expectedWeeklyWorkouts(userId);
  const workouts = existing.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID && isWorkoutKind(row.event_kind),
  );

  const expectedGymsByWeekKind = new Map<string, RehabPlanEventInsert>();
  const expectedRunsByWeek = new Map<number, RehabPlanEventInsert[]>();

  for (const row of expected) {
    const week = row.plan_week;
    if (week == null) {
      continue;
    }
    if (isGymKind(row.event_kind)) {
      expectedGymsByWeekKind.set(`${week}:${row.event_kind}`, row);
    } else {
      const list = expectedRunsByWeek.get(week) ?? [];
      list.push(row);
      expectedRunsByWeek.set(week, list);
    }
  }

  for (const runs of expectedRunsByWeek.values()) {
    runs.sort((a, b) => a.start_at.localeCompare(b.start_at));
  }

  const existingGymsByWeekKind = new Map<string, ScheduleRow>();
  const existingRunsByWeek = new Map<number, ScheduleRow[]>();

  for (const row of workouts) {
    const week = row.plan_week;
    if (week == null) {
      continue;
    }
    if (isGymKind(row.event_kind)) {
      existingGymsByWeekKind.set(`${week}:${row.event_kind}`, row);
    } else {
      const list = existingRunsByWeek.get(week) ?? [];
      list.push(row);
      existingRunsByWeek.set(week, list);
    }
  }

  for (const runs of existingRunsByWeek.values()) {
    runs.sort((a, b) => a.start_at.localeCompare(b.start_at));
  }

  const patches: SchedulePatch[] = [];
  const usedIds = new Set<string>();
  const inserts: RehabPlanEventInsert[] = [];

  for (const [key, target] of expectedGymsByWeekKind) {
    const row = existingGymsByWeekKind.get(key);
    if (row) {
      usedIds.add(row.id);
      if (row.start_at !== target.start_at || row.end_at !== target.end_at) {
        patches.push({
          id: row.id,
          start_at: target.start_at,
          end_at: target.end_at,
        });
      }
      continue;
    }

    inserts.push({
      ...target,
      id: crypto.randomUUID(),
      plan_week:
        target.plan_week != null && target.plan_week > 12 ? 12 : target.plan_week,
    });
    void key;
  }

  for (const [week, expectedRuns] of expectedRunsByWeek) {
    const existingRuns = existingRunsByWeek.get(week) ?? [];

    expectedRuns.forEach((target, index) => {
      const row = existingRuns[index];
      if (row) {
        usedIds.add(row.id);
        if (row.start_at !== target.start_at || row.end_at !== target.end_at) {
          patches.push({
            id: row.id,
            start_at: target.start_at,
            end_at: target.end_at,
          });
        }
        return;
      }

      inserts.push({
        ...target,
        id: crypto.randomUUID(),
        plan_week:
          target.plan_week != null && target.plan_week > 12 ? 12 : target.plan_week,
      });
    });
  }

  const deleteIds = workouts
    .filter((row) => !usedIds.has(row.id) && !row.completed_at)
    .map((row) => row.id);

  return { patches, inserts, deleteIds };
}

/** Dates still missing after sync (uses the seed template, including retest recovery weeks). */
export function workoutCoverageGaps(
  userId: string,
  rows: ScheduleRow[],
): string[] {
  const expected = expectedWeeklyWorkouts(userId);
  const gaps: string[] = [];

  for (const target of expected) {
    const day = target.start_at.slice(0, 10);
    const found = rows.some(
      (row) =>
        row.plan_week === target.plan_week &&
        row.event_kind === target.event_kind &&
        row.start_at.startsWith(day),
    );
    if (!found) {
      gaps.push(`w${target.plan_week} ${target.event_kind} ${day}`);
    }
  }

  return gaps;
}
