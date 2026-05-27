"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { notifyShoppingListSaved } from "@/lib/notifications/notification-events";
import { resolveHouseholdOwnerUserId } from "@/lib/shopping/household-owner";
import { isUuid } from "@/lib/shopping/is-uuid";
import { createClient } from "@/lib/supabase/server";

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

  const ownerId = await resolveHouseholdOwnerUserId(user.id);
  const purchasedAt = new Date().toISOString();

  const { error: insertError } = await supabase.from("purchase_events").insert({
    user_id: ownerId,
    staple_id: stapleId,
    item_name: name,
    purchased_at: purchasedAt,
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  if (stapleId) {
    // RLS now allows household members to update the shared staple row.
    const { error: updateError } = await supabase
      .from("staples")
      .update({ last_purchased_at: purchasedAt })
      .eq("id", stapleId);

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

  const ownerId = await resolveHouseholdOwnerUserId(user.id);

  const { data: rows, error: listError } = await supabase
    .from("staples")
    .select("id, name")
    .eq("user_id", ownerId);

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
      user_id: ownerId,
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

/** Hide a staple from the Suggested chips (left swipe dismiss). */
export async function dismissStapleFromSuggestions(
  stapleId: string,
): Promise<ShoppingListOpResult> {
  if (!isUuid(stapleId)) {
    return { ok: false, message: "Invalid staple id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("staples")
    .update({ hidden_from_suggestions: true })
    .eq("id", stapleId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Staple not found." };
  }

  revalidatePath(ROUTES.shopping);
  revalidatePath(ROUTES.shoppingAdmin);
  return { ok: true };
}

export type ShoppingListOpResult =
  | { ok: true }
  | { ok: false; message: string };

export type UpsertShoppingListItemInput = {
  id: string;
  stapleId?: string | null;
  name: string;
  quantity?: string | null;
  checked?: boolean;
  position?: number;
  /** When true, send a push notification to household peers (use for new items). */
  notify?: boolean;
};

/**
 * Insert or update a single shopping list row by id. Row-level so concurrent
 * edits between household members don't clobber each other's snapshot.
 *
 * Always writes user_id = household_owner_for(currentUser) so both partners see
 * the same row under shared-household RLS.
 */
export async function upsertShoppingListItem(
  input: UpsertShoppingListItemInput,
): Promise<ShoppingListOpResult> {
  if (!isUuid(input.id)) {
    return { ok: false, message: "Invalid list item id." };
  }
  const name = input.name.trim();
  if (!name) {
    return { ok: false, message: "Item name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const ownerId = await resolveHouseholdOwnerUserId(user.id);
  const stapleId =
    input.stapleId && isUuid(input.stapleId) ? input.stapleId : null;

  const { error } = await supabase.from("shopping_list_items").upsert(
    {
      id: input.id,
      user_id: ownerId,
      staple_id: stapleId,
      name,
      quantity: input.quantity?.trim() || null,
      checked: input.checked ?? false,
      position: input.position ?? 0,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  if (input.notify) {
    void notifyShoppingListSaved(user.id);
  }
  revalidatePath(ROUTES.shopping);
  return { ok: true };
}

/** Remove a single list item by id. RLS limits scope to the household. */
export async function deleteShoppingListItem(
  id: string,
): Promise<ShoppingListOpResult> {
  if (!isUuid(id)) {
    return { ok: false, message: "Invalid list item id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.shopping);
  return { ok: true };
}

/** Set `checked` on every row in the household list (Check all / Uncheck all). */
export async function setAllShoppingListItemsChecked(
  checked: boolean,
): Promise<ShoppingListOpResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const ownerId = await resolveHouseholdOwnerUserId(user.id);

  const { error } = await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("user_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.shopping);
  return { ok: true };
}

/** Delete every list row in the household ("Remove all" / "Clear list"). */
export async function clearShoppingList(): Promise<ShoppingListOpResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const ownerId = await resolveHouseholdOwnerUserId(user.id);

  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  void notifyShoppingListSaved(user.id);
  revalidatePath(ROUTES.shopping);
  return { ok: true };
}
