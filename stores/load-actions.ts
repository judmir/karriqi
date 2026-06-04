"use server";

import { fetchCalendarEventsForUser } from "@/lib/calendar/fetch-calendar-events";
import { getMockCalendarEvents } from "@/lib/calendar/mock-calendar-events";
import { isSupabaseConfigured } from "@/lib/env";
import { ensureNeuroRehabProgramReady } from "@/lib/rehab/ensure-neuro-rehab-program";
import { fetchRehabPlanEventsForUser } from "@/lib/rehab/fetch-rehab-plan-events";
import { isGoogleCalendarConfigured } from "@/lib/env/google-calendar";
import { getGoogleCalendarConnection } from "@/lib/google-calendar/connection";
import { fetchRuleOf3DaysForUser } from "@/lib/rule-of-3/fetch-rule-of-3";
import { fetchRecentPurchaseEventsForCadence } from "@/lib/shopping/fetch-recent-purchase-events";
import { fetchShoppingListForUser } from "@/lib/shopping/fetch-shopping-list";
import { fetchStaplesWithDefaults } from "@/lib/shopping/fetch-staples-with-defaults";
import { resolveHouseholdOwnerUserId } from "@/lib/shopping/household-owner";
import { mockStaples } from "@/lib/shopping/mock-staples";
import { medianGapDaysByStaple } from "@/lib/shopping/suggestions";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureHouseholdLinked } from "@/lib/household/ensure-household-linked";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { fetchTodosBoardSummary } from "@/lib/todo/fetch-todos";
import type { CalendarEvent } from "@/types/calendar";
import type { RehabPlanEvent } from "@/types/rehab";
import type { RehabPlanListItem } from "@/types/rehab";
import type { RehabClinicalItem } from "@/types/rehab";
import type { RuleOf3Day } from "@/types/rule-of-3";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";
import type { TodoAssignableMember, TodoBoardItem } from "@/types/todo";

type SignedOut = { ok: false; reason: "signed_out" | "not_configured" };

export type KanbanStorePayload =
  | SignedOut
  | {
      ok: true;
      todos: TodoBoardItem[];
      assignableUsers: TodoAssignableMember[];
      persistence: boolean;
    };

export async function loadKanbanStoreAction(): Promise<KanbanStorePayload> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  await ensureHouseholdLinked();

  const [assignableResult, todosResult] = await Promise.allSettled([
    fetchAssignableMembers(user),
    fetchTodosBoardSummary(),
  ]);

  return {
    ok: true,
    todos: todosResult.status === "fulfilled" ? todosResult.value : [],
    assignableUsers:
      assignableResult.status === "fulfilled" ? assignableResult.value : [],
    persistence: todosResult.status === "fulfilled",
  };
}

export type CalendarStorePayload =
  | SignedOut
  | {
      ok: true;
      events: CalendarEvent[];
      persistence: boolean;
      googleConfigured: boolean;
      googleConnected: boolean;
      requiresGoogleConnection: boolean;
      googleEmail: string | null;
      lastSyncedAt: string | null;
    };

export async function loadCalendarStoreAction(): Promise<CalendarStorePayload> {
  const googleConfigured = isGoogleCalendarConfigured();

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      events: getMockCalendarEvents(),
      persistence: false,
      googleConfigured: false,
      googleConnected: false,
      requiresGoogleConnection: false,
      googleEmail: null,
      lastSyncedAt: null,
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  const connection = await getGoogleCalendarConnection(user.id);
  if (!connection) {
    return {
      ok: true,
      events: [],
      persistence: false,
      googleConfigured,
      googleConnected: false,
      requiresGoogleConnection: true,
      googleEmail: null,
      lastSyncedAt: null,
    };
  }

  try {
    const events = await fetchCalendarEventsForUser();
    const refreshed = await getGoogleCalendarConnection(user.id);
    return {
      ok: true,
      events,
      persistence: true,
      googleConfigured,
      googleConnected: true,
      requiresGoogleConnection: false,
      googleEmail: refreshed?.googleEmail ?? connection.googleEmail,
      lastSyncedAt: refreshed?.lastSyncedAt ?? connection.lastSyncedAt,
    };
  } catch {
    const events = await fetchCalendarEventsForUser().catch(() => []);
    return {
      ok: true,
      events,
      persistence: true,
      googleConfigured,
      googleConnected: true,
      requiresGoogleConnection: false,
      googleEmail: connection.googleEmail,
      lastSyncedAt: connection.lastSyncedAt,
    };
  }
}

export type RehabPlanStorePayload =
  | SignedOut
  | {
      ok: true;
      events: RehabPlanEvent[];
      persistence: boolean;
    };

export async function loadRehabPlanStoreAction(): Promise<RehabPlanStorePayload> {
  if (!isSupabaseConfigured()) {
    const { generateNeuroRehabProgramEvents } = await import(
      "@/modules/rehab/neuro-rehab-2026/generate-program-events"
    );
    const { mapRehabPlanEvent } = await import("@/lib/rehab/rehab-plan-event-map");
    const mockRows = generateNeuroRehabProgramEvents("local");
    const events = mockRows.map((row, i) =>
      mapRehabPlanEvent({
        id: `demo-${i}`,
        user_id: "local",
        title: row.title,
        description: row.description ?? null,
        start_at: row.start_at,
        end_at: row.end_at,
        all_day: row.all_day ?? false,
        color: row.color ?? "blue",
        completed_at: null,
        event_kind: row.event_kind,
        program_id: row.program_id,
        plan_week: row.plan_week,
        series_id: null,
        recurrence_rule: null,
        recurrence_at: null,
        recurrence_cancelled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    );
    return { ok: true, events, persistence: false };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  await ensureNeuroRehabProgramReady(user.id);
  const events = await fetchRehabPlanEventsForUser();
  return { ok: true, events, persistence: true };
}

export type RehabPlanListStorePayload =
  | SignedOut
  | {
      ok: true;
      items: RehabPlanListItem[];
      persistence: boolean;
    };

export async function loadRehabPlanListStoreAction(): Promise<RehabPlanListStorePayload> {
  const { REHAB_PLAN_CATALOG } = await import(
    "@/modules/rehab/neuro-rehab-2026/plan-catalog"
  );

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: REHAB_PLAN_CATALOG.map((item) => ({
        ...item,
        completedAt: null,
        notes: "",
      })),
      persistence: false,
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  const { fetchRehabPlanListForUser } = await import(
    "@/lib/rehab/fetch-rehab-plan-list"
  );
  const items = await fetchRehabPlanListForUser(user.id);
  return { ok: true, items, persistence: true };
}

export type RehabClinicalStorePayload =
  | SignedOut
  | {
      ok: true;
      items: RehabClinicalItem[];
      persistence: boolean;
    };

export async function loadRehabClinicalStoreAction(): Promise<RehabClinicalStorePayload> {
  const { REHAB_CLINICAL_ITEMS } = await import(
    "@/modules/rehab/neuro-rehab-2026/clinical-content"
  );

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: REHAB_CLINICAL_ITEMS.map((item) => ({
        ...item,
        completedAt: null,
        notes: "",
        subtasksDone: [],
      })),
      persistence: false,
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  const { fetchRehabClinicalForUser } = await import(
    "@/lib/rehab/fetch-rehab-clinical"
  );
  const items = await fetchRehabClinicalForUser(user.id);
  return { ok: true, items, persistence: true };
}

export type ShoppingStorePayload =
  | SignedOut
  | {
      ok: true;
      staples: StapleItem[];
      listItems: ShoppingListItem[];
      purchasePersistence: boolean;
      listPersistence: boolean;
      medianIntervalByStapleId: Record<string, number>;
      householdOwnerId: string | null;
    };

export async function loadShoppingStoreAction(): Promise<ShoppingStorePayload> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  await ensureHouseholdLinked();

  const [ownerResult, staplesResult, listResult, eventsResult] =
    await Promise.allSettled([
      resolveHouseholdOwnerUserId(user.id),
      fetchStaplesWithDefaults(user.id),
      fetchShoppingListForUser(),
      fetchRecentPurchaseEventsForCadence(),
    ]);

  return {
    ok: true,
    staples:
      staplesResult.status === "fulfilled" ? staplesResult.value : mockStaples,
    listItems: listResult.status === "fulfilled" ? listResult.value : [],
    purchasePersistence: staplesResult.status === "fulfilled",
    listPersistence: listResult.status === "fulfilled",
    medianIntervalByStapleId:
      eventsResult.status === "fulfilled"
        ? medianGapDaysByStaple(eventsResult.value)
        : {},
    householdOwnerId:
      ownerResult.status === "fulfilled" ? ownerResult.value : null,
  };
}

export type RuleOf3StorePayload =
  | SignedOut
  | {
      ok: true;
      days: RuleOf3Day[];
      persistence: boolean;
    };

export async function loadRuleOf3StoreAction(): Promise<RuleOf3StorePayload> {
  if (!isSupabaseConfigured()) {
    return { ok: true, days: [], persistence: false };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed_out" };
  }

  const days = await fetchRuleOf3DaysForUser(user.id);
  return { ok: true, days, persistence: true };
}
