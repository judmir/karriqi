"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { fetchRecentPurchaseEventsForCadence } from "@/lib/shopping/fetch-recent-purchase-events";
import { fetchShoppingListForUser } from "@/lib/shopping/fetch-shopping-list";
import { fetchStaplesWithDefaults } from "@/lib/shopping/fetch-staples-with-defaults";
import { resolveHouseholdOwnerUserId } from "@/lib/shopping/household-owner";
import { mockStaples } from "@/lib/shopping/mock-staples";
import { medianGapDaysByStaple } from "@/lib/shopping/suggestions";
import { getSessionUser } from "@/lib/supabase/server";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { fetchTodosBoardSummary } from "@/lib/todo/fetch-todos";
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
