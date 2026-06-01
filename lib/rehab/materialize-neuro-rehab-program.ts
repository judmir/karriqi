import { deleteAllProgramEventsForUser } from "@/lib/rehab/dedupe-rehab-program-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

const BATCH_SIZE = 100;

const EXPECTED_NEURO_REHAB_EVENT_COUNT =
  generateNeuroRehabProgramEvents("count-probe").length;

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
  if (
    error.code === "42P01" ||
    error.message.includes("rehab_user_programs")
  ) {
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

async function countProgramEvents(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("rehab_plan_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("program_id", NEURO_REHAB_PROGRAM_ID);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
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

  let count = await countProgramEvents(admin, userId);
  let reset = false;

  if (count === EXPECTED_NEURO_REHAB_EVENT_COUNT) {
    return { ok: true, inserted: 0, skipped: true };
  }

  if (count !== 0) {
    await deleteAllProgramEventsForUser(userId);
    await releaseMaterializationLock(admin, userId);
    reset = true;
    count = 0;
  }

  const lock = await claimMaterializationLock(admin, userId);
  if (lock.status === "held") {
    const currentCount = await countProgramEvents(admin, userId);
    if (currentCount === EXPECTED_NEURO_REHAB_EVENT_COUNT) {
      return { ok: true, inserted: 0, skipped: true, reset };
    }
    return { ok: true, inserted: 0, skipped: true, reset };
  }

  const rows = generateNeuroRehabProgramEvents(userId);
  let inserted = 0;

  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await admin.from("rehab_plan_events").insert(batch);

      if (error) {
        throw new Error(error.message);
      }
      inserted += batch.length;
    }
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

  return { ok: true, inserted, skipped: false, reset };
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
