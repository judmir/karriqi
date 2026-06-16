import { deleteAllProgramEventsForUser } from "@/lib/rehab/dedupe-rehab-program-events";
import { parseEventDescription } from "@/lib/calendar/event-subtasks";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

const BATCH_SIZE = 100;

const GYM_EVENT_KINDS = ["gym_a", "gym_b", "gym_c", "gym_d"] as const;

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

async function repairGeneratedGymEventDescriptions(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<number> {
  const generatedGymEvents = generateNeuroRehabProgramEvents(userId).filter(
    (event) =>
      event.description &&
      GYM_EVENT_KINDS.includes(
        event.event_kind as (typeof GYM_EVENT_KINDS)[number],
      ),
  );
  const expectedByKey = new Map(
    generatedGymEvents.map((event) => [
      `${event.event_kind}:${event.start_at}`,
      event.description ?? null,
    ]),
  );

  const { data, error } = await admin
    .from("rehab_plan_events")
    .select("id, start_at, event_kind, description")
    .eq("user_id", userId)
    .eq("program_id", NEURO_REHAB_PROGRAM_ID)
    .in("event_kind", [...GYM_EVENT_KINDS]);

  if (error) {
    throw new Error(error.message);
  }

  let repaired = 0;
  for (const row of data ?? []) {
    const expected = expectedByKey.get(`${row.event_kind}:${row.start_at}`);
    if (!expected) {
      continue;
    }

    const parsed = parseEventDescription(row.description);
    if (parsed.subtasks.length > 0) {
      continue;
    }

    const { error: updateError } = await admin
      .from("rehab_plan_events")
      .update({ description: expected })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    repaired += 1;
  }

  return repaired;
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

  // Existing rows are the schedule source of truth — never wipe on count drift.
  if (count > 0) {
    await repairGeneratedGymEventDescriptions(admin, userId);
    return { ok: true, inserted: 0, skipped: true };
  }

  const lock = await claimMaterializationLock(admin, userId);
  if (lock.status === "held") {
    const currentCount = await countProgramEvents(admin, userId);
    if (currentCount > 0) {
      await repairGeneratedGymEventDescriptions(admin, userId);
      return { ok: true, inserted: 0, skipped: true };
    }
    return { ok: true, inserted: 0, skipped: true };
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
