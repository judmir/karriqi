export const NEURO_REHAB_PROGRAM_ID = "neuro-rehab-2026-v1";

/** Monday 8 June 2026 — program Day 0 / Week 1 start. */
export const PROGRAM_START = new Date(2026, 5, 8);

export const PROGRAM_WEEKS = 12;

export const RETEST_WEEKS = [4, 8, 12] as const;

export type RetestWeek = (typeof RETEST_WEEKS)[number];

export function isRetestWeek(week: number): week is RetestWeek {
  return (RETEST_WEEKS as readonly number[]).includes(week);
}
