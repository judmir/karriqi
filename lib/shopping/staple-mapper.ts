import type { Database } from "@/types/database";
import type { StapleItem } from "@/types/shopping";

type StapleRow = Database["public"]["Tables"]["staples"]["Row"];

export function stapleRowToItem(row: StapleRow): StapleItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    unit: row.unit ?? undefined,
    typicalIntervalDays: row.typical_interval_days ?? undefined,
    lastPurchasedAt: row.last_purchased_at ?? undefined,
    createdAt: row.created_at,
  };
}
