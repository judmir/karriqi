import { createClient } from "@/lib/supabase/server";
import { listRowToItem } from "@/lib/shopping/list-item-mapper";
import type { ShoppingListItem } from "@/types/shopping";

export async function fetchShoppingListForUser(): Promise<ShoppingListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(listRowToItem);
}
