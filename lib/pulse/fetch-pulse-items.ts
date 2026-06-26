import { createClient } from "@/lib/supabase/server";
import { mapPulseRow } from "@/lib/pulse/map-pulse-row";
import type { PulseItem } from "@/types/pulse";

export async function fetchPulseItemsForUser(
  userId: string,
): Promise<PulseItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pulse_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPulseRow);
}
