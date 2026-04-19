import { createClient } from "@/lib/supabase/server";
import { stapleRowToItem } from "@/lib/shopping/staple-mapper";
import type { StapleItem } from "@/types/shopping";

/** Loads staples for the current session user (RLS). */
export async function fetchStaplesForUser(): Promise<StapleItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staples")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(stapleRowToItem);
}
