import type { SupabaseClient } from "@supabase/supabase-js";

import type { IngestResult } from "@/lib/ingest/http";
import { resolveHouseholdOwnerUserId } from "@/lib/shopping/household-owner";
import { isUuid } from "@/lib/shopping/is-uuid";
import type {
  ShoppingListIngestBody,
  ShoppingListItemIngest,
} from "@/modules/ingest/schemas/shopping-list";
import type { Database } from "@/types/database";

async function upsertOneItem(
  admin: SupabaseClient<Database>,
  ownerId: string,
  item: ShoppingListItemIngest,
): Promise<IngestResult> {
  const id = item.id && isUuid(item.id) ? item.id : crypto.randomUUID();
  const stapleId =
    item.stapleId && isUuid(item.stapleId) ? item.stapleId : null;

  const { data: existing } = await admin
    .from("shopping_list_items")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("shopping_list_items").upsert(
    {
      id,
      user_id: ownerId,
      staple_id: stapleId,
      name: item.name.trim(),
      quantity: item.quantity?.trim() || null,
      checked: item.checked ?? false,
      position: item.position ?? 0,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { id, action: existing ? "updated" : "created" };
}

export async function ingestShoppingList(
  admin: SupabaseClient<Database>,
  body: ShoppingListIngestBody,
): Promise<IngestResult[]> {
  const ownerId = await resolveHouseholdOwnerUserId(body.userId);
  const results: IngestResult[] = [];

  for (const item of body.items) {
    results.push(await upsertOneItem(admin, ownerId, item));
  }

  return results;
}
