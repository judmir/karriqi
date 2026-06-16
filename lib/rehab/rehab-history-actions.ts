"use server";

import { fetchRehabArchivedEventsForUser } from "@/lib/rehab/fetch-rehab-archived-events";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";
import type { RehabArchivedEvent } from "@/types/rehab";

export type RehabArchivedPayload =
  | { ok: false; reason: "signed_out" | "not_configured" }
  | { ok: true; events: RehabArchivedEvent[] };

export async function loadRehabArchivedEventsAction(): Promise<RehabArchivedPayload> {
  if (!isSupabaseConfigured()) {
    return { ok: true, events: [] };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  try {
    const events = await fetchRehabArchivedEventsForUser(user.id);
    return { ok: true, events };
  } catch {
    return { ok: true, events: [] };
  }
}
