import { REHAB_PLAN_CATALOG } from "@/modules/rehab/neuro-rehab-2026/plan-catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RehabPlanCatalogItem, RehabPlanListItem } from "@/types/rehab";

export async function ensureRehabPlanCatalogSeeded(): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { count, error: countError } = await admin
    .from("rehab_plan_catalog")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  if (count && count > 0) {
    return;
  }

  const rows = REHAB_PLAN_CATALOG.map((item) => ({
    id: item.id,
    parent_id: item.parentId,
    kind: item.kind,
    title: item.title,
    body: item.body,
    sort_order: item.sortOrder,
  }));

  const { error } = await admin.from("rehab_plan_catalog").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

function mapCatalogRow(row: {
  id: string;
  parent_id: string | null;
  kind: string;
  title: string;
  body: string;
  sort_order: number;
}): RehabPlanCatalogItem {
  return {
    id: row.id,
    parentId: row.parent_id,
    kind: row.kind as RehabPlanCatalogItem["kind"],
    title: row.title,
    body: row.body,
    sortOrder: row.sort_order,
  };
}

export async function fetchRehabPlanCatalog(): Promise<RehabPlanCatalogItem[]> {
  await ensureRehabPlanCatalogSeeded();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_plan_catalog")
    .select("id, parent_id, kind, title, body, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return REHAB_PLAN_CATALOG;
  }

  return data.map(mapCatalogRow);
}

export async function fetchRehabPlanListForUser(
  userId: string,
): Promise<RehabPlanListItem[]> {
  const [catalog, stateResult] = await Promise.all([
    fetchRehabPlanCatalog(),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("rehab_plan_item_state")
        .select("item_id, completed_at, notes")
        .eq("user_id", userId);
    })(),
  ]);

  const stateByItemId = new Map<
    string,
    { completedAt: string | null; notes: string }
  >();

  if (stateResult.error) {
    throw new Error(stateResult.error.message);
  }

  for (const row of stateResult.data ?? []) {
    stateByItemId.set(row.item_id, {
      completedAt: row.completed_at,
      notes: row.notes ?? "",
    });
  }

  return catalog.map((item) => {
    const state = stateByItemId.get(item.id);
    return {
      ...item,
      completedAt: state?.completedAt ?? null,
      notes: state?.notes ?? "",
    };
  });
}

export function mergeRehabPlanListItems(
  catalog: RehabPlanCatalogItem[],
  stateRows: Array<{
    item_id: string;
    completed_at: string | null;
    notes: string;
  }>,
): RehabPlanListItem[] {
  const stateByItemId = new Map(
    stateRows.map((row) => [
      row.item_id,
      { completedAt: row.completed_at, notes: row.notes ?? "" },
    ]),
  );

  return catalog.map((item) => {
    const state = stateByItemId.get(item.id);
    return {
      ...item,
      completedAt: state?.completedAt ?? null,
      notes: state?.notes ?? "",
    };
  });
}
