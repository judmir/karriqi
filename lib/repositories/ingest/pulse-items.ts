import type { SupabaseClient } from "@supabase/supabase-js";

import type { IngestResult } from "@/lib/ingest/http";
import { isUuid } from "@/lib/shopping/is-uuid";
import type {
  PulseItemIngest,
  PulseItemsIngestBody,
} from "@/modules/ingest/schemas/pulse-items";
import type { Database, Json } from "@/types/database";

type PulseRow = Database["public"]["Tables"]["pulse_items"]["Row"];
type PulseInsert = Database["public"]["Tables"]["pulse_items"]["Insert"];
type PulseUpdate = Database["public"]["Tables"]["pulse_items"]["Update"];

function rowFromIngest(
  userId: string,
  item: PulseItemIngest,
): PulseInsert {
  return {
    id: item.id && isUuid(item.id) ? item.id : undefined,
    user_id: userId,
    title: item.title.trim(),
    summary: item.summary.trim(),
    why_it_matters: item.whyItMatters?.trim() || null,
    suggested_action: item.suggestedAction?.trim() || null,
    category: item.category,
    impact: item.impact,
    urgency: item.urgency,
    status: item.status ?? "new",
    source_type: item.sourceType ?? "cron",
    source_url: item.sourceUrl ?? null,
    source_title: item.sourceTitle?.trim() || null,
    starts_at: item.startsAt ?? null,
    due_at: item.dueAt ?? null,
    expires_at: item.expiresAt ?? null,
    dedupe_key: item.dedupeKey.trim(),
    confidence: item.confidence ?? null,
    payload: (item.payload ?? {}) as Json,
  };
}

function updateFromIngest(item: PulseItemIngest): PulseUpdate {
  return {
    title: item.title.trim(),
    summary: item.summary.trim(),
    why_it_matters: item.whyItMatters?.trim() || null,
    suggested_action: item.suggestedAction?.trim() || null,
    category: item.category,
    impact: item.impact,
    urgency: item.urgency,
    status: item.status ?? "new",
    source_type: item.sourceType ?? "cron",
    source_url: item.sourceUrl ?? null,
    source_title: item.sourceTitle?.trim() || null,
    starts_at: item.startsAt ?? null,
    due_at: item.dueAt ?? null,
    expires_at: item.expiresAt ?? null,
    dedupe_key: item.dedupeKey.trim(),
    confidence: item.confidence ?? null,
    payload: (item.payload ?? {}) as Json,
  };
}

async function findExistingId(
  admin: SupabaseClient<Database>,
  userId: string,
  item: PulseItemIngest,
): Promise<string | null> {
  const { data: byDedupe, error: dedupeError } = await admin
    .from("pulse_items")
    .select("id")
    .eq("user_id", userId)
    .eq("dedupe_key", item.dedupeKey.trim())
    .maybeSingle();

  if (dedupeError) {
    throw new Error(dedupeError.message);
  }
  if (byDedupe?.id) {
    return byDedupe.id;
  }

  if (item.id && isUuid(item.id)) {
    const { data: byId, error: idError } = await admin
      .from("pulse_items")
      .select("id")
      .eq("id", item.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (idError) {
      throw new Error(idError.message);
    }
    if (byId?.id) {
      return byId.id;
    }
  }

  return null;
}

async function ingestOneItem(
  admin: SupabaseClient<Database>,
  userId: string,
  item: PulseItemIngest,
): Promise<IngestResult> {
  const existingId = await findExistingId(admin, userId, item);

  if (existingId) {
    const { error } = await admin
      .from("pulse_items")
      .update(updateFromIngest(item))
      .eq("id", existingId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { id: existingId, action: "updated" };
  }

  const insert = rowFromIngest(userId, item);
  const id = insert.id ?? crypto.randomUUID();

  const { error } = await admin.from("pulse_items").insert({
    ...insert,
    id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id, action: "created" };
}

export async function ingestPulseItems(
  admin: SupabaseClient<Database>,
  body: PulseItemsIngestBody,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const item of body.items) {
    results.push(await ingestOneItem(admin, body.userId, item));
  }
  return results;
}

export type { PulseRow };
