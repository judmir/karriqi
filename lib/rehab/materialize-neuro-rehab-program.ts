import { deleteAllProgramEventsForUser } from "@/lib/rehab/dedupe-rehab-program-events";
import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import {
  clampProgramPlanWeek,
  NEURO_REHAB_PROGRAM_ID,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEventInsert } from "@/types/rehab";

const BATCH_SIZE = 100;

/**
 * Stable identity for a program occurrence, independent of string formatting:
 * the timestamptz round-trip from Postgres ("+00:00") differs textually from the
 * generated ISO ("Z"), so we key on the parsed instant, not the raw string.
 */
function occurrenceKey(eventKind: string, startAt: string): string {
  return `${eventKind}\u0000${new Date(startAt).getTime()}`;
}

function rowsForDbInsert(
  rows: RehabPlanEventInsert[],
): RehabPlanEventInsert[] {
  return rows.map((row) => ({
    ...row,
    plan_week: clampProgramPlanWeek(row.plan_week),
  }));
}

type MaterializationLock =
  | { status: "claimed" }
  | { status: "held" }
  | { status: "unavailable" };

async function claimMaterializationLock(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<MaterializationLock> {
  const { error } = await admin.from("rehab_user_programs").insert({
    user_id: userId,
    program_id: NEURO_REHAB_PROGRAM_ID,
  });

  if (!error) {
    return { status: "claimed" };
  }
  if (error.code === "23505") {
    return { status: "held" };
  }
  if (error.code === "42P01" || error.message.includes("rehab_user_programs")) {
    return { status: "unavailable" };
  }
  throw new Error(error.message);
}

async function releaseMaterializationLock(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<void> {
  await admin
    .from("rehab_user_programs")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", NEURO_REHAB_PROGRAM_ID);
}

type ExistingProgramOccurrences = {
  count: number;
  keys: Set<string>;
};

/**
 * Load the identity of every active program row already stored for this user.
 */
async function fetchExistingProgramOccurrences(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<ExistingProgramOccurrences> {
  const { data, error } = await withoutSoftDeleted(
    admin
      .from("rehab_plan_events")
      .select("event_kind, start_at")
      .eq("user_id", userId)
      .eq("program_id", NEURO_REHAB_PROGRAM_ID),
  );

  if (error) {
    throw new Error(error.message);
  }

  const keys = new Set<string>();
  for (const row of data ?? []) {
    keys.add(occurrenceKey(row.event_kind, row.start_at));
  }

  return { count: data?.length ?? 0, keys };
}

async function insertProgramEventBatches(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  rows: RehabPlanEventInsert[],
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rowsForDbInsert(rows.slice(i, i + BATCH_SIZE));
    const { error } = await admin.from("rehab_plan_events").insert(batch);
    if (error) {
      throw new Error(error.message);
    }
    inserted += batch.length;
  }
  return inserted;
}

export type MaterializeNeuroRehabResult =
  | { ok: true; inserted: number; skipped: true; reset?: boolean }
  | { ok: true; inserted: number; skipped: false; reset?: boolean }
  | { ok: false; message: string };

export async function materializeNeuroRehabProgramForUser(
  userId: string,
): Promise<MaterializeNeuroRehabResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Server admin client not configured." };
  }

  const existing = await fetchExistingProgramOccurrences(admin, userId);

  // Already seeded: do nothing on page load (no top-up, no repair scan).
  if (existing.count > 0) {
    return { ok: true, inserted: 0, skipped: true };
  }

  // First-time seed: claim a lock so concurrent loads don't double-insert.
  const lock = await claimMaterializationLock(admin, userId);
  if (lock.status === "held") {
    return { ok: true, inserted: 0, skipped: true };
  }

  const rows = generateNeuroRehabProgramEvents(userId);
  let inserted = 0;

  try {
    inserted = await insertProgramEventBatches(admin, rows);
  } catch (err) {
    await deleteAllProgramEventsForUser(userId);
    if (lock.status === "claimed") {
      await releaseMaterializationLock(admin, userId);
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Insert failed.",
    };
  }

  return { ok: true, inserted, skipped: false };
}

/** Wipe and re-seed the full 12-week program for one user. */
export async function resetNeuroRehabProgramForUser(
  userId: string,
): Promise<MaterializeNeuroRehabResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Server admin client not configured." };
  }

  await deleteAllProgramEventsForUser(userId);
  await releaseMaterializationLock(admin, userId);

  return materializeNeuroRehabProgramForUser(userId);
}
