import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";
import { buildSpeechEventSyncPlan } from "@/lib/rehab/sync-neuro-rehab-speech-events";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

/** Push latest Albanian reading texts to stored speech events (preserves completed sessions). */
export async function syncNeuroRehabSpeechContentForUser(
  userId: string,
): Promise<number> {
  const admin = createAdminClient();
  if (!admin) {
    return 0;
  }

  const { data, error } = await withoutSoftDeleted(
    admin
      .from("rehab_plan_events")
      .select(
        "id, title, description, start_at, end_at, event_kind, program_id, plan_week, completed_at",
      )
      .eq("user_id", userId)
      .eq("program_id", NEURO_REHAB_PROGRAM_ID)
      .eq("event_kind", "speech"),
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ScheduleRow[];
  if (rows.length === 0) {
    return 0;
  }

  const plan = buildSpeechEventSyncPlan(userId, rows);
  let updated = 0;

  for (const patch of plan.patches) {
    const row = rows.find((item) => item.id === patch.id);
    if (!row || row.completed_at) {
      continue;
    }

    const scheduleChanged =
      patch.start_at != null &&
      (patch.start_at !== row.start_at || patch.end_at !== row.end_at);
    const descriptionChanged =
      patch.description !== undefined &&
      patch.description !== row.description;

    if (!scheduleChanged && !descriptionChanged) {
      continue;
    }

    const { error: updateError } = await admin
      .from("rehab_plan_events")
      .update({
        ...(scheduleChanged
          ? { start_at: patch.start_at, end_at: patch.end_at }
          : {}),
        ...(descriptionChanged ? { description: patch.description } : {}),
      })
      .eq("id", patch.id)
      .is("deleted_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    updated += 1;
  }

  return updated;
}
