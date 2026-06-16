import { readFileSync } from "node:fs";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { missingProgramSeedRows } from "@/lib/rehab/append-neuro-rehab-program-seed-rows";
import type { Database } from "@/types/database";
import {
  buildUniformShiftPatch,
  buildUniformShiftPatches,
  daysToAlignProgramStart,
  isProgramAlreadyRescheduled,
  needsJuneDeferralShift,
  rescheduleDayShift,
  RESCHEDULE_TEMP_BUMP_DAYS,
  type ReschedulePatch,
  type RescheduleRow,
} from "@/lib/rehab/reschedule-neuro-rehab-program";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

const RUN = process.env.RUN_RESCHEDULE === "1";
const DRY = process.env.RUN_RESCHEDULE_DRY === "1";

function loadEnvLocal() {
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional for CI unit runs
  }
}

loadEnvLocal();

async function applyPatches(
  admin: SupabaseClient<Database>,
  patches: ReschedulePatch[],
) {
  for (const patch of patches) {
    const { error } = await admin
      .from("rehab_plan_events")
      .update({
        start_at: patch.start_at,
        end_at: patch.end_at,
        recurrence_rule: patch.recurrence_rule,
        recurrence_at: patch.recurrence_at,
      })
      .eq("id", patch.id);
    expect(error).toBeNull();
  }
}

function rowsAfterPatches(
  rows: RescheduleRow[],
  patches: ReschedulePatch[],
): RescheduleRow[] {
  return rows.map((row) => {
    const patch = patches.find((candidate) => candidate.id === row.id);
    return patch
      ? {
          ...row,
          start_at: patch.start_at,
          end_at: patch.end_at,
          recurrence_rule: patch.recurrence_rule,
          recurrence_at: patch.recurrence_at,
        }
      : row;
  });
}

function buildDeferredPatchesAfterBump(rows: RescheduleRow[]): ReschedulePatch[] {
  const bumped = buildUniformShiftPatches(rows, RESCHEDULE_TEMP_BUMP_DAYS);
  const bumpedRows = rowsAfterPatches(rows, bumped);
  return bumpedRows
    .map((row, index) => {
      const original = rows[index]!;
      const shift = rescheduleDayShift(original.start_at, original.event_kind);
      return buildUniformShiftPatch(row, shift - RESCHEDULE_TEMP_BUMP_DAYS);
    })
    .filter((patch): patch is ReschedulePatch => patch !== null);
}

async function applyUniformShiftWithBump(
  admin: SupabaseClient<Database>,
  rows: RescheduleRow[],
  targetShiftDays: number,
): Promise<RescheduleRow[]> {
  const tempBump = buildUniformShiftPatches(rows, RESCHEDULE_TEMP_BUMP_DAYS);
  await applyPatches(admin, tempBump);
  const bumpedRows = rowsAfterPatches(rows, tempBump);
  const finalPatches = buildUniformShiftPatches(
    bumpedRows,
    targetShiftDays - RESCHEDULE_TEMP_BUMP_DAYS,
  );
  await applyPatches(admin, finalPatches);
  return rowsAfterPatches(bumpedRows, finalPatches);
}

async function applyDeferredShiftWithBump(
  admin: SupabaseClient<Database>,
  rows: RescheduleRow[],
): Promise<RescheduleRow[]> {
  const tempBump = buildUniformShiftPatches(rows, RESCHEDULE_TEMP_BUMP_DAYS);
  await applyPatches(admin, tempBump);
  const bumpedRows = rowsAfterPatches(rows, tempBump);
  const finalPatches = buildDeferredPatchesAfterBump(rows);
  await applyPatches(admin, finalPatches);
  return rowsAfterPatches(bumpedRows, finalPatches);
}

describe.runIf(RUN)("apply neuro rehab reschedule to Supabase", () => {
  it("shifts existing rows and appends missing Day 0 / tail days", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toBeTruthy();
    expect(serviceKey).toBeTruthy();

    const admin = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin
      .from("rehab_plan_events")
      .select(
        "id, user_id, start_at, end_at, event_kind, program_id, recurrence_rule, recurrence_at",
      )
      .eq("program_id", NEURO_REHAB_PROGRAM_ID);

    expect(error).toBeNull();
    const rows = data ?? [];
    expect(rows.length).toBeGreaterThan(0);

    if (isProgramAlreadyRescheduled(rows)) {
      return;
    }

    const userId = rows[0]!.user_id;
    let finalRows: RescheduleRow[] = rows;

    if (needsJuneDeferralShift(rows)) {
      if (DRY) {
        const tempBump = buildUniformShiftPatches(rows, RESCHEDULE_TEMP_BUMP_DAYS);
        const bumpedRows = rowsAfterPatches(rows, tempBump);
        const finalPatches = buildDeferredPatchesAfterBump(rows);
        const inserts = missingProgramSeedRows(
          userId,
          rowsAfterPatches(bumpedRows, finalPatches).map((row) => ({
            event_kind: row.event_kind,
            start_at: row.start_at,
          })),
        );
        console.log(
          `dry-run defer: ${tempBump.length + finalPatches.length} update(s), ${inserts.length} insert(s)`,
        );
        return;
      }
      finalRows = await applyDeferredShiftWithBump(admin, rows);
    } else {
      const alignShift = daysToAlignProgramStart(rows);
      if (alignShift === null) {
        throw new Error("Program rows do not match a known reschedule scenario.");
      }
      if (DRY) {
        const tempBump = buildUniformShiftPatches(rows, RESCHEDULE_TEMP_BUMP_DAYS);
        const bumpedRows = rowsAfterPatches(rows, tempBump);
        const finalPatches = buildUniformShiftPatches(
          bumpedRows,
          alignShift - RESCHEDULE_TEMP_BUMP_DAYS,
        );
        const inserts = missingProgramSeedRows(
          userId,
          rowsAfterPatches(bumpedRows, finalPatches).map((row) => ({
            event_kind: row.event_kind,
            start_at: row.start_at,
          })),
        );
        console.log(
          `dry-run align ${alignShift}: ${tempBump.length + finalPatches.length} update(s), ${inserts.length} insert(s)`,
        );
        return;
      }
      finalRows = await applyUniformShiftWithBump(admin, rows, alignShift);
    }

    const inserts = missingProgramSeedRows(
      userId,
      finalRows.map((row) => ({
        event_kind: row.event_kind,
        start_at: row.start_at,
      })),
    );

    if (inserts.length > 0) {
      const { error: insertError } = await admin
        .from("rehab_plan_events")
        .insert(inserts);
      expect(insertError).toBeNull();
    }
  }, 120_000);
});
