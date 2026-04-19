import { DEFAULT_ALBANIAN_STAPLES } from "@/lib/shopping/default-albanian-staples";
import { fetchStaplesForUser } from "@/lib/shopping/fetch-staples";
import { createClient } from "@/lib/supabase/server";
import type { StapleItem } from "@/types/shopping";

/**
 * Loads staples; if the user has none, inserts the default Albanian catalog once.
 */
export async function fetchStaplesWithDefaults(): Promise<StapleItem[]> {
  let staples = await fetchStaplesForUser();
  if (staples.length > 0) {
    return staples;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return staples;
  }

  const rows = DEFAULT_ALBANIAN_STAPLES.map((s) => ({
    user_id: user.id,
    name: s.name,
    typical_interval_days: s.typicalIntervalDays,
  }));

  const { error } = await supabase.from("staples").insert(rows);

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  staples = await fetchStaplesForUser();
  return staples;
}
