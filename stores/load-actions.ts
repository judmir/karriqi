"use server";

import { fetchCalendarEventsForUser } from "@/lib/calendar/fetch-calendar-events";
import { getMockCalendarEvents } from "@/lib/calendar/mock-calendar-events";
import { isSupabaseConfigured } from "@/lib/env";
import { isGoogleCalendarConfigured } from "@/lib/env/google-calendar";
import { getGoogleCalendarConnection } from "@/lib/google-calendar/connection";
import { syncGoogleCalendarForUser } from "@/lib/google-calendar/sync";
import { fetchRecentPurchaseEventsForCadence } from "@/lib/shopping/fetch-recent-purchase-events";
import { fetchShoppingListForUser } from "@/lib/shopping/fetch-shopping-list";
import { fetchStaplesWithDefaults } from "@/lib/shopping/fetch-staples-with-defaults";
import { resolveHouseholdOwnerUserId } from "@/lib/shopping/household-owner";
import { mockStaples } from "@/lib/shopping/mock-staples";
import { medianGapDaysByStaple } from "@/lib/shopping/suggestions";
import { getSessionUser } from "@/lib/supabase/server";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { fetchTodosBoardSummary } from "@/lib/todo/fetch-todos";
import type { CalendarEvent } from "@/types/calendar";
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
    await syncGoogleCalendarForUser(user.id);
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
