import { filterActiveRows, withoutSoftDeleted } from "@/lib/db/soft-delete";
import { createClient } from "@/lib/supabase/server";
import { isValidPosition, itemId } from "@/lib/rule-of-3/rule-of-3-utils";
import type { RuleOf3Day, RuleOf3Item } from "@/types/rule-of-3";

/** How many recent day rows to load for history. */
const HISTORY_LIMIT = 120;

type ItemRow = {
  position: number;
  title: string;
  notes: string;
  completed_at: string | null;
  blocked_reason: string;
  deleted_at?: string | null;
};

type DayRow = {
  id: string;
  plan_date: string;
  reflection: string;
  created_at: string;
  updated_at: string;
  rule_of_3_items: ItemRow[] | null;
};

function mapItem(planDate: string, row: ItemRow): RuleOf3Item | null {
  if (!isValidPosition(row.position)) {
    return null;
  }
  return {
    id: itemId(planDate, row.position),
    position: row.position,
    title: row.title ?? "",
    notes: row.notes ?? "",
    completedAt: row.completed_at,
    blockedReason: row.blocked_reason ?? "",
  };
}

function mapDay(row: DayRow): RuleOf3Day {
  const items = filterActiveRows(row.rule_of_3_items ?? [])
    .map((item) => mapItem(row.plan_date, item))
    .filter((item): item is RuleOf3Item => item !== null)
    .sort((a, b) => a.position - b.position);

  return {
    id: row.plan_date,
    planDate: row.plan_date,
    reflection: row.reflection ?? "",
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchRuleOf3DaysForUser(
  userId: string,
): Promise<RuleOf3Day[]> {
  const supabase = await createClient();
  const { data, error } = await withoutSoftDeleted(
    supabase.from("rule_of_3_days").select(
      "id, plan_date, reflection, created_at, updated_at, rule_of_3_items(position, title, notes, completed_at, blocked_reason, deleted_at)",
    ),
  )
    .eq("user_id", userId)
    .order("plan_date", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as DayRow[] | null)?.map(mapDay) ?? [];
}
