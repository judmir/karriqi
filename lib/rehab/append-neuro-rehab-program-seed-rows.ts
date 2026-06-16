import { addDays, startOfDay } from "date-fns";

import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import {
  NEURO_REHAB_PROGRAM_ID,
  PROGRAM_EXTRA_DAYS,
  PROGRAM_START,
  PROGRAM_WEEKS,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEventInsert } from "@/types/rehab";

type ExistingRow = {
  event_kind: string;
  start_at: string;
};

function rowKey(eventKind: string, startAt: string): string {
  return `${eventKind}:${startAt}`;
}

/** Day 0 + the six deferred tail days from the seed template, if missing in DB. */
export function missingProgramSeedRows(
  userId: string,
  existing: ExistingRow[],
): RehabPlanEventInsert[] {
  const generated = generateNeuroRehabProgramEvents(userId);
  const existingKeys = new Set(
    existing.map((row) => rowKey(row.event_kind, row.start_at)),
  );

  const programStart = startOfDay(PROGRAM_START);
  const tailStart = addDays(programStart, PROGRAM_WEEKS * 7);
  const tailEnd = addDays(
    programStart,
    PROGRAM_WEEKS * 7 + PROGRAM_EXTRA_DAYS - 1,
  );

  return generated.filter((row) => {
    if (row.program_id !== NEURO_REHAB_PROGRAM_ID) {
      return false;
    }

    const day = startOfDay(new Date(row.start_at));
    const isDay0OnStart =
      row.event_kind === "day0" && day.getTime() === programStart.getTime();
    const inDeferredTail =
      day >= startOfDay(tailStart) && day <= startOfDay(tailEnd);

    if (!isDay0OnStart && !inDeferredTail) {
      return false;
    }

    return !existingKeys.has(rowKey(row.event_kind, row.start_at));
  }).map((row) => ({
    ...row,
    plan_week:
      row.plan_week != null && row.plan_week > 12 ? 12 : row.plan_week,
  }));
}
