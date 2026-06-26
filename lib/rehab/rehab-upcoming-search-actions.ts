"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { fetchUpcomingSearchPage } from "@/lib/rehab/fetch-upcoming-search";
import type { UpcomingKindFilterId, UpcomingSearchPage } from "@/lib/rehab/rehab-upcoming-utils";
import { getSessionUser } from "@/lib/supabase/server";

export type SearchUpcomingRehabInput = {
  query?: string;
  kindFilters?: UpcomingKindFilterId[];
  offset?: number;
  limit?: number;
};

export type SearchUpcomingRehabResult =
  | { ok: false; reason: "signed_out" | "not_configured" }
  | { ok: true; page: UpcomingSearchPage; persistence: boolean };

export async function searchUpcomingRehabAction(
  input: SearchUpcomingRehabInput,
): Promise<SearchUpcomingRehabResult> {
  if (!isSupabaseConfigured()) {
    const page = await fetchUpcomingSearchPage(input, { demo: true });
    return { ok: true, page, persistence: false };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  const page = await fetchUpcomingSearchPage(input);
  return { ok: true, page, persistence: true };
}
