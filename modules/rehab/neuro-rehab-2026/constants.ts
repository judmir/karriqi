export const NEURO_REHAB_PROGRAM_ID = "neuro-rehab-2026-v1";

/** Sunday 14 June 2026 — program Day 0 / Week 1 start (seed template for new users). */
export const PROGRAM_START = new Date(2026, 5, 14);

export const PROGRAM_WEEKS = 12;

/** DB check constraint `rehab_plan_events_plan_week_range` allows 1–12 only. */
export const PROGRAM_PLAN_WEEK_MAX = PROGRAM_WEEKS;

/** Six deferred days (original 8–13 Jun) appended after week 12 in the seed template. */
export const PROGRAM_EXTRA_DAYS = 6;

export const RETEST_WEEKS = [4, 8, 12] as const;

export type RetestWeek = (typeof RETEST_WEEKS)[number];

export function isRetestWeek(week: number): week is RetestWeek {
  return (RETEST_WEEKS as readonly number[]).includes(week);
}

/** Generator week 13+ (deferred tail) must be stored as week 12 in Postgres. */
export function clampProgramPlanWeek(
  planWeek: number | null | undefined,
): number | null {
  if (planWeek == null) {
    return null;
  }
  return Math.min(planWeek, PROGRAM_PLAN_WEEK_MAX);
}
