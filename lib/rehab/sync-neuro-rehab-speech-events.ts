import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import {
  clampProgramPlanWeek,
  NEURO_REHAB_PROGRAM_ID,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import { mergeSpeechDescriptionForSync } from "@/modules/rehab/neuro-rehab-2026/speech-content";
import type { RehabPlanEventInsert } from "@/types/rehab";

import type { SchedulePatch, ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";

function dayKey(startAt: string): string {
  return startAt.slice(0, 10);
}

export function expectedSpeechEvents(userId: string): RehabPlanEventInsert[] {
  return generateNeuroRehabProgramEvents(userId).filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID && row.event_kind === "speech",
  );
}

export type SpeechEventSyncPlan = {
  patches: SchedulePatch[];
  inserts: RehabPlanEventInsert[];
  deleteIds: string[];
};

/** One speech row per program day at 09:55; reschedule legacy slots and fill gaps. */
export function buildSpeechEventSyncPlan(
  userId: string,
  existing: ScheduleRow[],
): SpeechEventSyncPlan {
  const expected = expectedSpeechEvents(userId);
  const speechRows = existing.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID && row.event_kind === "speech",
  );

  const existingByDay = new Map<string, ScheduleRow[]>();
  for (const row of speechRows) {
    const day = dayKey(row.start_at);
    const list = existingByDay.get(day) ?? [];
    list.push(row);
    existingByDay.set(day, list);
  }

  const patches: SchedulePatch[] = [];
  const inserts: RehabPlanEventInsert[] = [];
  const deleteIds: string[] = [];
  const usedIds = new Set<string>();

  for (const target of expected) {
    const day = dayKey(target.start_at);
    const rows = existingByDay.get(day) ?? [];
    const primary =
      rows.find((row) => row.completed_at != null) ??
      rows.sort((a, b) => a.start_at.localeCompare(b.start_at))[0];

    if (primary) {
      usedIds.add(primary.id);
      const needsSchedulePatch =
        primary.start_at !== target.start_at ||
        primary.end_at !== target.end_at;
      const targetDescription = mergeSpeechDescriptionForSync(
        target.description,
        primary.description,
      );
      const needsDescriptionPatch =
        targetDescription != null &&
        primary.description !== targetDescription;

      if (needsSchedulePatch || needsDescriptionPatch) {
        patches.push({
          id: primary.id,
          start_at: target.start_at,
          end_at: target.end_at,
          ...(needsDescriptionPatch
            ? { description: targetDescription }
            : {}),
        });
      }

      for (const extra of rows) {
        if (extra.id !== primary.id && !extra.completed_at) {
          deleteIds.push(extra.id);
        }
      }
      continue;
    }

    inserts.push({
      ...target,
      id: crypto.randomUUID(),
      plan_week: clampProgramPlanWeek(target.plan_week),
    });
  }

  const expectedDays = new Set(expected.map((row) => dayKey(row.start_at)));
  for (const row of speechRows) {
    if (usedIds.has(row.id) || deleteIds.includes(row.id) || row.completed_at) {
      continue;
    }
    if (!expectedDays.has(dayKey(row.start_at))) {
      deleteIds.push(row.id);
    }
  }

  return { patches, inserts, deleteIds };
}

/** Program days still missing a speech row after sync. */
export function speechCoverageGaps(
  userId: string,
  rows: ScheduleRow[],
): string[] {
  const expected = expectedSpeechEvents(userId);
  const gaps: string[] = [];

  for (const target of expected) {
    const day = dayKey(target.start_at);
    const found = rows.some(
      (row) =>
        row.event_kind === "speech" &&
        row.program_id === NEURO_REHAB_PROGRAM_ID &&
        dayKey(row.start_at) === day,
    );
    if (!found) {
      gaps.push(`w${target.plan_week} speech ${day}`);
    }
  }

  return gaps;
}
