import { describe, expect, it } from "vitest";

import {
  clampProgramPlanWeek,
  PROGRAM_PLAN_WEEK_MAX,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";

describe("clampProgramPlanWeek", () => {
  it("caps deferred-tail generator weeks at the DB maximum", () => {
    expect(clampProgramPlanWeek(13)).toBe(PROGRAM_PLAN_WEEK_MAX);
    expect(clampProgramPlanWeek(12)).toBe(12);
    expect(clampProgramPlanWeek(null)).toBeNull();
  });

  it("generator emits week 13 rows for the deferred tail", () => {
    const week13 = generateNeuroRehabProgramEvents("u").filter(
      (row) => row.plan_week === 13,
    );
    expect(week13.length).toBeGreaterThan(0);
    expect(
      week13.every(
        (row) => clampProgramPlanWeek(row.plan_week) === PROGRAM_PLAN_WEEK_MAX,
      ),
    ).toBe(true);
  });
});
