import type { Database } from "@/types/database";
import type { ShoppingListItem } from "@/types/shopping";

type ListRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];

export function listRowToItem(row: ListRow): ShoppingListItem {
  return {
    id: row.id,
    stapleId: row.staple_id ?? undefined,
    name: row.name,
    quantity: row.quantity ?? undefined,
    checked: row.checked,
    addedAt: row.created_at,
  };
}
