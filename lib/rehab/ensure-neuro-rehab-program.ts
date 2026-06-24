import { ensureRehabWikiPagesSeeded } from "@/lib/rehab/fetch-rehab-wiki";
import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createAdminClient } from "@/lib/supabase/admin";
import { materializeNeuroRehabProgramForUser } from "@/lib/rehab/materialize-neuro-rehab-program";
import { syncNeuroRehabGymContentForUser } from "@/lib/rehab/sync-neuro-rehab-gym-content";
import { syncNeuroRehabSpeechContentForUser } from "@/lib/rehab/sync-neuro-rehab-speech-content";
import { syncNeuroRehabStoicPathEventsForUser } from "@/lib/rehab/sync-neuro-rehab-stoic-path-events";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

async function runRehabContentSync(
  userId: string,
  label: string,
  sync: (userId: string) => Promise<unknown>,
): Promise<void> {
  try {
    await sync(userId);
  } catch (error) {
    console.error(`[rehab] ${label} failed for ${userId}:`, error);
  }
}

/** Idempotent: seed wiki (global) + 12-week calendar events (per user, first time only). */
export async function ensureNeuroRehabProgramReady(userId: string): Promise<void> {
  await ensureRehabWikiPagesSeeded();

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { count, error } = await withoutSoftDeleted(
    admin
      .from("rehab_plan_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("program_id", NEURO_REHAB_PROGRAM_ID),
  );

  if (error) {
    throw new Error(error.message);
  }

  // Never re-materialize on navigation — duplicates were caused by top-up here.
  if ((count ?? 0) > 0) {
    await runRehabContentSync(userId, "gym content sync", syncNeuroRehabGymContentForUser);
    await runRehabContentSync(
      userId,
      "speech content sync",
      syncNeuroRehabSpeechContentForUser,
    );
    await runRehabContentSync(
      userId,
      "stoic path sync",
      syncNeuroRehabStoicPathEventsForUser,
    );
    return;
  }

  const result = await materializeNeuroRehabProgramForUser(userId);
  if (!result.ok) {
    throw new Error(result.message);
  }

  await runRehabContentSync(
    userId,
    "stoic path sync",
    syncNeuroRehabStoicPathEventsForUser,
  );
}
