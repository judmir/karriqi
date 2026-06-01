import { REHAB_CLINICAL_ITEMS } from "@/modules/rehab/neuro-rehab-2026/clinical-content";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RehabClinicalCatalogItem, RehabClinicalItem } from "@/types/rehab";

export async function ensureRehabClinicalCatalogSeeded(): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { count, error: countError } = await admin
    .from("rehab_clinical_catalog")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  if (count && count > 0) {
    return;
  }

  const rows = REHAB_CLINICAL_ITEMS.map((item) => ({
    id: item.id,
    phase: item.phase,
    title: item.title,
    body: item.body,
    sort_order: item.sortOrder,
    calendar_event_kind: item.calendarEventKind,
  }));

  const { error } = await admin.from("rehab_clinical_catalog").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

function mapCatalogRow(row: {
  id: string;
  phase: string;
  title: string;
  body: string;
  sort_order: number;
  calendar_event_kind: string | null;
}): RehabClinicalCatalogItem {
  return {
    id: row.id,
    phase: row.phase as RehabClinicalCatalogItem["phase"],
    title: row.title,
    body: row.body,
    sortOrder: row.sort_order,
    calendarEventKind:
      row.calendar_event_kind === "day0" || row.calendar_event_kind === "retest"
        ? row.calendar_event_kind
        : null,
  };
}

export async function fetchRehabClinicalCatalog(): Promise<RehabClinicalCatalogItem[]> {
  await ensureRehabClinicalCatalogSeeded();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_clinical_catalog")
    .select("id, phase, title, body, sort_order, calendar_event_kind")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return REHAB_CLINICAL_ITEMS;
  }

  return data.map(mapCatalogRow);
}

export async function fetchRehabClinicalForUser(
  userId: string,
): Promise<RehabClinicalItem[]> {
  const [catalog, stateResult] = await Promise.all([
    fetchRehabClinicalCatalog(),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("rehab_clinical_item_state")
        .select("item_id, completed_at, notes, subtasks_done")
        .eq("user_id", userId);
    })(),
  ]);

  if (stateResult.error) {
    throw new Error(stateResult.error.message);
  }

  const stateByItemId = new Map<
    string,
    { completedAt: string | null; notes: string; subtasksDone: number[] }
  >();

  for (const row of stateResult.data ?? []) {
    stateByItemId.set(row.item_id, {
      completedAt: row.completed_at,
      notes: row.notes ?? "",
      subtasksDone: normalizeSubtasksDone(row.subtasks_done),
    });
  }

  return catalog.map((item) => {
    const state = stateByItemId.get(item.id);
    return {
      ...item,
      completedAt: state?.completedAt ?? null,
      notes: state?.notes ?? "",
      subtasksDone: state?.subtasksDone ?? [],
    };
  });
}

function normalizeSubtasksDone(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is number => Number.isInteger(entry));
}
