import type { SupabaseClient } from "@supabase/supabase-js";

import { tryParseApartmentFindingPayload } from "@/modules/operator/apartment-finding";
import type { ApartmentFindingPayload } from "@/modules/operator/apartment-finding-schema";
import type { OperatorEntryRow } from "@/types/operator";
import type { Database } from "@/types/database";

const APARTMENT_KIND = "apartment_finding" as const;

export type ApartmentFindingListItemView = {
  row: OperatorEntryRow;
  payload: ApartmentFindingPayload;
  unseen: boolean;
};

function isPgUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error && typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : null;
  return code === "23505";
}

/**
 * First insert wins; repeating the call is a no-op (unique on user_id + entry_id).
 */
export async function markOperatorEntryViewed(
  client: SupabaseClient<Database>,
  userId: string,
  entryId: string,
): Promise<void> {
  const { error } = await client.from("operator_entry_views").insert({
    user_id: userId,
    entry_id: entryId,
  });

  if (error && !isPgUniqueViolation(error)) {
    throw error;
  }
}

export async function fetchApartmentFindingsForUser(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ApartmentFindingListItemView[]> {
  const { data: rows, error: rowsErr } = await client
    .from("operator_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", APARTMENT_KIND)
    .order("updated_at", { ascending: false });

  if (rowsErr) throw rowsErr;

  const views: ApartmentFindingListItemView[] = [];
  for (const row of rows ?? []) {
    const payload = tryParseApartmentFindingPayload(row.payload);
    if (!payload) continue;

    views.push({
      row,
      payload,
      unseen: true,
    });
  }

  if (views.length === 0) return [];

  const ids = views.map((v) => v.row.id);
  const { data: seenRows, error: seenErr } = await client
    .from("operator_entry_views")
    .select("entry_id")
    .eq("user_id", userId)
    .in("entry_id", ids);

  if (seenErr) throw seenErr;
  const seen = new Set((seenRows ?? []).map((s) => s.entry_id));

  return views.map((v) => ({
    ...v,
    unseen: !seen.has(v.row.id),
  }));
}

export async function fetchApartmentFindingByIdForUser(
  client: SupabaseClient<Database>,
  userId: string,
  id: string,
): Promise<{ row: OperatorEntryRow; payload: ApartmentFindingPayload } | null> {
  const { data: row, error } = await client
    .from("operator_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("kind", APARTMENT_KIND)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const payload = tryParseApartmentFindingPayload(row.payload);
  if (!payload) return null;

  return { row, payload };
}
