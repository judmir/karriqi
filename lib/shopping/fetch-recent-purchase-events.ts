import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PurchaseEventCadenceRow = Pick<
  Database["public"]["Tables"]["purchase_events"]["Row"],
  "staple_id" | "purchased_at"
>;

/** Recent purchase events with a staple link (for cadence / median gap). */
export async function fetchRecentPurchaseEventsForCadence(
  limit = 500,
): Promise<PurchaseEventCadenceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_events")
    .select("staple_id, purchased_at")
    .not("staple_id", "is", null)
    .order("purchased_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PurchaseEventCadenceRow[];
}
