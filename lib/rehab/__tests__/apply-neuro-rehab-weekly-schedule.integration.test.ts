import { requireSupabaseAdminEnv } from "@/lib/rehab/__tests__/load-integration-env";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { buildStoicFixPlan, type StoicRow } from "@/lib/rehab/fix-neuro-rehab-stoic-series";
import type { Database } from "@/types/database";
import {
  buildUniqueTempBumpPatches,
  countScheduleCollisions,
  type SchedulePatch,
  type ScheduleRow,
} from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";
import { buildWeeklyWorkoutSyncPlan, workoutCoverageGaps } from "@/lib/rehab/sync-neuro-rehab-weekly-workouts";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

const RUN = process.env.RUN_WEEKLY_SCHEDULE === "1";

async function fetchProgramRows(
  admin: SupabaseClient<Database>,
  select: string,
  eventKinds?: string[],
) {
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = admin
      .from("rehab_plan_events")
      .select(select)
      .eq("program_id", NEURO_REHAB_PROGRAM_ID)
      .range(offset, offset + pageSize - 1);
    if (eventKinds) {
      query = query.in("event_kind", eventKinds);
    }
    const { data, error } = await query;
    expect(error).toBeNull();
    const page = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < pageSize) {
      break;
    }
  }
  return rows;
}

async function applySchedulePatches(
  admin: SupabaseClient<Database>,
  rows: ScheduleRow[],
  patches: SchedulePatch[],
) {
  if (patches.length === 0) {
    return;
  }

  const patchIds = new Set(patches.map((patch) => patch.id));
  const patchedWeeks = new Set(
    rows
      .filter((row) => patchIds.has(row.id) && row.plan_week != null)
      .map((row) => row.plan_week as number),
  );
  const bumpRows = rows.filter(
    (row) =>
      patchIds.has(row.id) ||
      (row.plan_week != null && patchedWeeks.has(row.plan_week)),
  );
  const tempBump = buildUniqueTempBumpPatches(bumpRows);
  for (const patch of tempBump) {
    const { error } = await admin
      .from("rehab_plan_events")
      .update({ start_at: patch.start_at, end_at: patch.end_at, ...(patch.title ? { title: patch.title } : {}), ...(patch.description !== undefined ? { description: patch.description } : {}) })
      .eq("id", patch.id);
    expect(error).toBeNull();
  }

  for (const patch of patches) {
    const { error } = await admin
      .from("rehab_plan_events")
      .update({ start_at: patch.start_at, end_at: patch.end_at, ...(patch.title ? { title: patch.title } : {}), ...(patch.description !== undefined ? { description: patch.description } : {}) })
      .eq("id", patch.id);
    expect(error).toBeNull();
  }
}


async function applyStoicUpdates(
  admin: SupabaseClient<Database>,
  stoicRows: StoicRow[],
  updates: import("@/lib/rehab/fix-neuro-rehab-stoic-series").StoicPatch[],
) {
  if (updates.length === 0) {
    return;
  }

  const updateIds = new Set(updates.map((patch) => patch.id));
  const bumpCandidates = stoicRows.filter((row) => updateIds.has(row.id));
  const tempBump = buildUniqueTempBumpPatches(
    bumpCandidates.map((row) => ({
      id: row.id,
      start_at: row.start_at,
      end_at: row.end_at,
      event_kind: row.event_kind,
      program_id: row.program_id,
    })),
  );
  for (const patch of tempBump) {
    const { error } = await admin
      .from("rehab_plan_events")
      .update({ start_at: patch.start_at, end_at: patch.end_at, ...(patch.title ? { title: patch.title } : {}), ...(patch.description !== undefined ? { description: patch.description } : {}) })
      .eq("id", patch.id);
    expect(error).toBeNull();
  }

  for (const patch of updates) {
    const { error: updateError } = await admin
      .from("rehab_plan_events")
      .update(patch)
      .eq("id", patch.id);
    expect(updateError).toBeNull();
  }
}

describe.runIf(RUN)("apply neuro rehab weekly schedule to Supabase", () => {
  it("syncs gym/run slots, fills gaps, and fixes stoic series overlap", async () => {
    const { url, serviceKey } = requireSupabaseAdminEnv();

    const admin = createClient<Database>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const scheduleRows = (await fetchProgramRows(
      admin,
      "id, title, description, start_at, end_at, event_kind, program_id, plan_week, completed_at, user_id",
      ["gym_a", "gym_b", "gym_c", "gym_d", "run_walk"],
    )) as (ScheduleRow & { user_id: string })[];

    const stoicRows = await fetchProgramRows(
      admin,
      "id, start_at, end_at, event_kind, program_id, series_id, recurrence_rule, recurrence_at, recurrence_cancelled, completed_at",
      ["stoic"],
    );

    const userId = scheduleRows[0]?.user_id;
    expect(userId).toBeTruthy();

    const beforeCollisions = countScheduleCollisions(scheduleRows);
    const syncPlan = buildWeeklyWorkoutSyncPlan(userId!, scheduleRows);

    if (syncPlan.deleteIds.length > 0) {
      const { error } = await admin
        .from("rehab_plan_events")
        .delete()
        .in("id", syncPlan.deleteIds);
      expect(error).toBeNull();
    }

    await applySchedulePatches(admin, scheduleRows, syncPlan.patches);

    if (syncPlan.inserts.length > 0) {
      const { error } = await admin
        .from("rehab_plan_events")
        .insert(syncPlan.inserts);
      expect(error).toBeNull();
    }

    const stoicPlan = buildStoicFixPlan(stoicRows as StoicRow[]);

    if (stoicPlan.deleteOverrideIds.length > 0) {
      const { error: deleteError } = await admin
        .from("rehab_plan_events")
        .delete()
        .in("id", stoicPlan.deleteOverrideIds);
      expect(deleteError).toBeNull();
    }

    await applyStoicUpdates(admin, stoicRows as StoicRow[], stoicPlan.updates);

    const afterRows = (await fetchProgramRows(
      admin,
      "id, start_at, end_at, event_kind, program_id, plan_week",
      ["gym_a", "gym_b", "gym_c", "gym_d", "run_walk"],
    )) as ScheduleRow[];

    const afterCollisions = countScheduleCollisions(afterRows);
    const gaps = workoutCoverageGaps(userId!, afterRows);
    expect(afterCollisions).toBe(0);
    expect(gaps).toEqual([]);
    console.log(
      `collisions ${beforeCollisions} -> ${afterCollisions}; deleted ${syncPlan.deleteIds.length}; patched ${syncPlan.patches.length}; inserted ${syncPlan.inserts.length}; stoic updates ${stoicPlan.updates.length}`,
    );
  }, 180_000);
});
