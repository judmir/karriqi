"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { notifyShoppingListSaved } from "@/lib/notifications/notification-events";
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

/** Replaces the user’s shopping list with the given rows (transactional delete + insert). */
export async function saveShoppingListItems(
  items: ShoppingListItem[],
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

  const { error: delError } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    return { ok: false, message: delError.message };
  }

  if (items.length === 0) {
    void notifyShoppingListSaved(user.id);
    revalidatePath(ROUTES.shopping);
    return { ok: true };
  }

  const rows = items.map((item, position) => ({
    id: item.id,
    user_id: user.id,
    staple_id:
      item.stapleId && isUuid(item.stapleId) ? item.stapleId : null,
    name: item.name.trim(),
    quantity: item.quantity?.trim() || null,
    checked: item.checked,
    position,
  }));

  const { error: insError } = await supabase
    .from("shopping_list_items")
    .insert(rows);

  if (insError) {
    return { ok: false, message: insError.message };
  }

  void notifyShoppingListSaved(user.id);

  revalidatePath(ROUTES.shopping);
  return { ok: true };
}
