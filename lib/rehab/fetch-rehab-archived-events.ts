import {
  mapRehabPlanEvent,
  REHAB_PLAN_EVENT_SELECT,
  type RehabPlanEventRow,
} from "@/lib/rehab/rehab-plan-event-map";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RehabArchivedEvent } from "@/types/rehab";

type ArchivedRow = RehabPlanEventRow & { deleted_at: string };

const ARCHIVED_SELECT = `${REHAB_PLAN_EVENT_SELECT}, deleted_at`;

function mapArchived(row: ArchivedRow): RehabArchivedEvent {
  return {
    ...mapRehabPlanEvent(row),
    deletedAt: row.deleted_at,
  };
}

/** Tombstoned rehab rows (hidden from normal RLS reads). Service-role only. */
export async function fetchRehabArchivedEventsForUser(
  userId: string,
  limit = 200,
): Promise<RehabArchivedEvent[]> {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from("rehab_plan_events")
    .select(ARCHIVED_SELECT)
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ArchivedRow[]).map(mapArchived);
}
