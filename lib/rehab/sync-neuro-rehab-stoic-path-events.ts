import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseStoicExerciseIdFromDescription } from "@/lib/rehab/stoic-path-event-metadata";
import { generateStoicPathProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-stoic-path-events";
import {
  clampProgramPlanWeek,
  NEURO_REHAB_PROGRAM_ID,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEventInsert } from "@/types/rehab";

import type { SchedulePatch, ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";

export type StoicPathEventRow = ScheduleRow & {
  description: string | null;
  recurrence_rule?: string | null;
};

export type StoicPathEventSyncPlan = {
  patches: SchedulePatch[];
  inserts: RehabPlanEventInsert[];
  completionPatches: Array<{ id: string; completed_at: string }>;
};

export function expectedStoicPathEvents(
  userId: string,
): RehabPlanEventInsert[] {
  return generateStoicPathProgramEvents(userId);
}

function exerciseIdFromRow(row: Pick<StoicPathEventRow, "description">): string | null {
  return parseStoicExerciseIdFromDescription(row.description);
}

/** Fill missing 84-day Stoic Path rows and backfill completed_at from rehab_stoic_completions. */
export function buildStoicPathEventSyncPlan(
  userId: string,
  existing: StoicPathEventRow[],
  completionsByExerciseId: Map<string, string>,
): StoicPathEventSyncPlan {
  const expected = expectedStoicPathEvents(userId);
  const pathRows = existing.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID &&
      row.event_kind === "stoic" &&
      !row.recurrence_rule,
  );

  const existingByExerciseId = new Map<string, StoicPathEventRow>();
  for (const row of pathRows) {
    const exerciseId = exerciseIdFromRow(row);
    if (!exerciseId || existingByExerciseId.has(exerciseId)) {
      continue;
    }
    existingByExerciseId.set(exerciseId, row);
  }

  const patches: SchedulePatch[] = [];
  const inserts: RehabPlanEventInsert[] = [];
  const completionPatches: Array<{ id: string; completed_at: string }> = [];

  for (const target of expected) {
    const exerciseId = parseStoicExerciseIdFromDescription(target.description);
    if (!exerciseId) {
      continue;
    }

    const row = existingByExerciseId.get(exerciseId);
    const completionAt = completionsByExerciseId.get(exerciseId);

    if (!row) {
      const id = crypto.randomUUID();
      inserts.push({
        ...target,
        id,
        plan_week: clampProgramPlanWeek(target.plan_week),
      });
      if (completionAt) {
        completionPatches.push({ id, completed_at: completionAt });
      }
      continue;
    }

    if (
      row.start_at !== target.start_at ||
      row.end_at !== target.end_at ||
      row.title !== target.title
    ) {
      patches.push({
        id: row.id,
        start_at: target.start_at,
        end_at: target.end_at,
        title: target.title,
        description: target.description,
      });
    }

    if (completionAt && !row.completed_at) {
      completionPatches.push({ id: row.id, completed_at: completionAt });
    }
  }

  return { patches, inserts, completionPatches };
}

export async function syncNeuroRehabStoicPathEventsForUser(
  userId: string,
): Promise<{ inserted: number; patched: number; completionsSynced: number }> {
  const admin = createAdminClient();
  if (!admin) {
    return { inserted: 0, patched: 0, completionsSynced: 0 };
  }

  const { data: eventRows, error: eventError } = await withoutSoftDeleted(
    admin
      .from("rehab_plan_events")
      .select(
        "id, title, description, start_at, end_at, event_kind, program_id, plan_week, completed_at, recurrence_rule",
      )
      .eq("user_id", userId)
      .eq("program_id", NEURO_REHAB_PROGRAM_ID)
      .eq("event_kind", "stoic"),
  );

  if (eventError) {
    throw new Error(eventError.message);
  }

  const { data: completionRows, error: completionError } = await admin
    .from("rehab_stoic_completions")
    .select("exercise_id, completed_at")
    .eq("user_id", userId);

  if (completionError) {
    throw new Error(completionError.message);
  }

  const completionsByExerciseId = new Map(
    (completionRows ?? []).map((row) => [row.exercise_id, row.completed_at]),
  );

  const plan = buildStoicPathEventSyncPlan(
    userId,
    (eventRows ?? []) as StoicPathEventRow[],
    completionsByExerciseId,
  );

  let patched = 0;
  for (const patch of plan.patches) {
    const { error } = await admin
      .from("rehab_plan_events")
      .update({
        start_at: patch.start_at,
        end_at: patch.end_at,
        ...(patch.title != null ? { title: patch.title } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
      })
      .eq("id", patch.id)
      .is("deleted_at", null);
    if (error) {
      throw new Error(error.message);
    }
    patched += 1;
  }

  if (plan.inserts.length > 0) {
    const { error } = await admin.from("rehab_plan_events").insert(plan.inserts);
    if (error) {
      throw new Error(error.message);
    }
  }

  let completionsSynced = 0;
  for (const patch of plan.completionPatches) {
    const { error } = await admin
      .from("rehab_plan_events")
      .update({ completed_at: patch.completed_at })
      .eq("id", patch.id)
      .is("completed_at", null)
      .is("deleted_at", null);
    if (error) {
      throw new Error(error.message);
    }
    completionsSynced += 1;
  }

  return {
    inserted: plan.inserts.length,
    patched,
    completionsSynced,
  };
}
