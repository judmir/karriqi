import type { SupabaseClient } from "@supabase/supabase-js";

import type { OperatorEntryIngestBody } from "@/modules/operator/operator-entry-ingest-schema";
import {
  pickCurrentWeekendPlannerEntry,
  tryParseWeekendPlannerPayload,
} from "@/modules/operator/weekend-planner";
import type { WeekendPlannerEntryView } from "@/types/operator";
import type { Database, Json } from "@/types/database";

/** Load all weekend planner rows for a user (small set; picker runs in-memory). */
export async function fetchWeekendPlannerRowsForUser(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["operator_entries"]["Row"][]> {
  const { data, error } = await client
    .from("operator_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", "weekend_planner");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchCurrentWeekendPlannerForUser(
  client: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date(),
): Promise<WeekendPlannerEntryView | null> {
  const rows = await fetchWeekendPlannerRowsForUser(client, userId);
  const picked = pickCurrentWeekendPlannerEntry(rows, now);
  if (!picked) {
    return null;
  }

  const payload = tryParseWeekendPlannerPayload(picked.payload);
  if (!payload) {
    return null;
  }

  return { row: picked, payload };
}

export async function upsertOperatorEntry(
  admin: SupabaseClient<Database>,
  body: OperatorEntryIngestBody,
): Promise<{ id: string; updatedAt: string }> {
  const row: Database["public"]["Tables"]["operator_entries"]["Insert"] = {
    user_id: body.userId,
    kind: body.kind,
    title: body.title,
    summary: body.summary ?? null,
    dedupe_key: body.dedupeKey,
    starts_at: body.startsAt ?? null,
    ends_at: body.endsAt ?? null,
    payload: body.payload as unknown as Json,
    source: "hermes",
  };

  const { data, error } = await admin
    .from("operator_entries")
    .upsert(row, {
      onConflict: "user_id,dedupe_key",
    })
    .select("id, updated_at")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Upsert succeeded but returned no row");
  }

  return { id: data.id, updatedAt: data.updated_at };
}
