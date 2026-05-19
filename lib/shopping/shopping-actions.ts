"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { notifyShoppingListSaved } from "@/lib/notifications/notification-events";
import { profileColorFromUserMeta } from "@/lib/profile/colors";
import { isUuid } from "@/lib/shopping/is-uuid";
import { createClient } from "@/lib/supabase/server";
import type { ShoppingListItem } from "@/types/shopping";

export type PurchaseResult =
  | { ok: true; purchasedAt: string; stapleIdForCatalog: string | null }
  | { ok: false; message: string };

export async function recordPurchase(input: {
  stapleId: string | null;
  itemName: string;
}): Promise<PurchaseResult> {
  const name = input.itemName.trim();
  if (!name) {
    return { ok: false, message: "Item name is required." };
  }

  const stapleId =
    input.stapleId && isUuid(input.stapleId) ? input.stapleId : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const purchasedAt = new Date().toISOString();

  const { error: insertError } = await supabase.from("purchase_events").insert({
    user_id: user.id,
    staple_id: stapleId,
    item_name: name,
    purchased_at: purchasedAt,
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  if (stapleId) {
    const { error: updateError } = await supabase
      .from("staples")
      .update({ last_purchased_at: purchasedAt })
      .eq("id", stapleId)
      .eq("user_id", user.id);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }
  }

  revalidatePath(ROUTES.shopping);
  revalidatePath(ROUTES.shoppingAdmin);

  return {
    ok: true,
    purchasedAt,
    stapleIdForCatalog: stapleId,
  };
}

export type CreateStapleResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createStaple(input: {
  name: string;
  category?: string;
  unit?: string;
  typicalIntervalDays?: number;
}): Promise<CreateStapleResult> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, message: "Name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: rows, error: listError } = await supabase
    .from("staples")
    .select("id, name")
    .eq("user_id", user.id);

  if (listError) {
    return { ok: false, message: listError.message };
  }

  const lower = name.toLowerCase();
  const hit = rows?.find((r) => r.name.trim().toLowerCase() === lower);
  if (hit) {
    return { ok: true, id: hit.id };
  }

  const { data: created, error: insertError } = await supabase
    .from("staples")
    .insert({
      user_id: user.id,
      name,
      category: input.category?.trim() || null,
      unit: input.unit?.trim() || null,
      typical_interval_days: input.typicalIntervalDays ?? null,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return { ok: false, message: insertError?.message ?? "Insert failed." };
  }

  revalidatePath(ROUTES.shopping);
  revalidatePath(ROUTES.shoppingAdmin);

  return { ok: true, id: created.id };
}

export type SaveListResult = { ok: true } | { ok: false; message: string };

/**
 * Persists the household shopping list. The list is shared across
 * household members (see migration
 * `20260518200000_shared_shopping_list_and_profile_color.sql`) and is also
 * synced live via Supabase Realtime, so multiple clients can mutate it
 * concurrently.
 *
 * Important: the caller passes `knownIds` — the set of ids the actor's UI
 * believed were on the list at the moment of save. The server only
 * deletes ids that are in `knownIds` but NOT in `items`. This is what
 * makes concurrent edits safe: if a peer adds a row between the actor's
 * read and write, that row is not in the actor's `knownIds`, so we never
 * delete it. Without this, the previous "fetch existing → delete missing"
 * approach would clobber a peer's just-added item.
 *
 *   - Delete: ids in `knownIds` but not in `items`.
 *   - Insert: items whose id is not yet in the DB — created under the
 *             current user, with the caller's profile color snapshotted
 *             into `created_by_color`.
 *   - Update: items already in the DB — only mutable fields (name,
 *             quantity, checked, position, staple_id). We never touch
 *             `user_id` or `created_by_color`, so peer-owned rows keep
 *             their creator identity even when reordered or checked off.
 */
export async function saveShoppingListItems(
  items: ShoppingListItem[],
  knownIds: string[] = [],
): Promise<SaveListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  for (const item of items) {
    if (!isUuid(item.id)) {
      return { ok: false, message: "Invalid list item id." };
    }
  }

  for (const id of knownIds) {
    if (!isUuid(id)) {
      return { ok: false, message: "Invalid knownIds entry." };
    }
  }

  const submittedIds = new Set(items.map((i) => i.id));

  const toDelete = Array.from(new Set(knownIds)).filter(
    (id) => !submittedIds.has(id),
  );

  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from("shopping_list_items")
      .delete()
      .in("id", toDelete);

    if (delError) {
      return { ok: false, message: delError.message };
    }
  }

  if (items.length === 0) {
    if (toDelete.length > 0) {
      void notifyShoppingListSaved(user.id);
    }
    revalidatePath(ROUTES.shopping);
    return { ok: true };
  }

  // Look up which submitted ids already exist so we can route between
  // insert (new) and update (existing). We limit the IN(...) query to the
  // submitted ids — this is bounded by the user's list length, unlike the
  // previous unbounded "select * from shopping_list_items".
  const { data: existingRows, error: fetchError } = await supabase
    .from("shopping_list_items")
    .select("id")
    .in("id", Array.from(submittedIds));

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  const existingIds = new Set((existingRows ?? []).map((r) => r.id));

  const actorColor =
    profileColorFromUserMeta(user.user_metadata as Record<string, unknown>) ??
    null;

  const newRows: Array<{
    id: string;
    user_id: string;
    staple_id: string | null;
    name: string;
    quantity: string | null;
    checked: boolean;
    position: number;
    created_by_color: string | null;
  }> = [];

  type UpdatePayload = {
    id: string;
    staple_id: string | null;
    name: string;
    quantity: string | null;
    checked: boolean;
    position: number;
  };
  const updates: UpdatePayload[] = [];

  items.forEach((item, position) => {
    const stapleId =
      item.stapleId && isUuid(item.stapleId) ? item.stapleId : null;
    const name = item.name.trim();
    const quantity = item.quantity?.trim() || null;

    if (existingIds.has(item.id)) {
      updates.push({
        id: item.id,
        staple_id: stapleId,
        name,
        quantity,
        checked: item.checked,
        position,
      });
    } else {
      newRows.push({
        id: item.id,
        user_id: user.id,
        staple_id: stapleId,
        name,
        quantity,
        checked: item.checked,
        position,
        created_by_color: actorColor,
      });
    }
  });

  if (newRows.length > 0) {
    const { error: insError } = await supabase
      .from("shopping_list_items")
      .insert(newRows);

    if (insError) {
      return { ok: false, message: insError.message };
    }
  }

  if (updates.length > 0) {
    const results = await Promise.all(
      updates.map(({ id, ...patch }) =>
        supabase.from("shopping_list_items").update(patch).eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return { ok: false, message: failed.error.message };
    }
  }

  // Only notify when something actually changed beyond reordering. We
  // err on the side of notifying for inserts / deletes; pure
  // updates also notify because checking items off is the canonical
  // "list activity" signal.
  void notifyShoppingListSaved(user.id);

  revalidatePath(ROUTES.shopping);
  return { ok: true };
}
