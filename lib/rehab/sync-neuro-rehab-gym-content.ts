import { withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";
import { buildWeeklyWorkoutSyncPlan } from "@/lib/rehab/sync-neuro-rehab-weekly-workouts";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

/** Push latest gym titles/checklists to stored events (preserves completed sessions). */
export async function syncNeuroRehabGymContentForUser(
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
      .in("event_kind", ["gym_a", "gym_b", "gym_c"]),
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ScheduleRow[];
  if (rows.length === 0) {
    return 0;
  }

  const plan = buildWeeklyWorkoutSyncPlan(userId, rows);
  let updated = 0;

  for (const patch of plan.patches) {
    const row = rows.find((item) => item.id === patch.id);
    if (!row || row.completed_at) {
      continue;
    }

    const titleChanged = patch.title != null && patch.title !== row.title;
    const descriptionChanged =
      patch.description !== undefined && patch.description !== row.description;

    if (!titleChanged && !descriptionChanged) {
      continue;
    }

    const { error: updateError } = await admin
      .from("rehab_plan_events")
      .update({
        ...(titleChanged ? { title: patch.title } : {}),
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
