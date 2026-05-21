"use client";

import { useEffect, useRef } from "react";

import { listRowToItem } from "@/lib/shopping/list-item-mapper";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { ShoppingListItem } from "@/types/shopping";

type ListRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];

function sortByPosition(
  items: ShoppingListItem[],
  positions: Map<string, number>,
): ShoppingListItem[] {
  return [...items].sort((a, b) => {
    const pa = positions.get(a.id) ?? 0;
    const pb = positions.get(b.id) ?? 0;
    return pa - pb;
  });
}

function rowsEqual(a: ShoppingListItem, b: ShoppingListItem): boolean {
  return (
    a.name === b.name &&
    a.checked === b.checked &&
    (a.quantity ?? null) === (b.quantity ?? null) &&
    (a.stapleId ?? null) === (b.stapleId ?? null)
  );
}

/**
 * Live-sync shopping list rows via Supabase Realtime (postgres_changes).
 *
 * Subscribes once after auth is ready (`INITIAL_SESSION` / `getSession`). Avoids
 * tearing down a connecting WebSocket by guarding against overlapping subscribe
 * calls (a common cause of "WebSocket is closed before the connection is established").
 */
export function useShoppingListRealtime({
  enabled,
  householdOwnerId,
  positionsRef,
  patchItems,
}: {
  enabled: boolean;
  householdOwnerId: string | null;
  positionsRef: React.MutableRefObject<Map<string, number>>;
  /** Receives an updater over the current items array (mirrors setState). */
  patchItems: (updater: (items: ShoppingListItem[]) => ShoppingListItem[]) => void;
}) {
  const patchItemsRef = useRef(patchItems);
  useEffect(() => {
    patchItemsRef.current = patchItems;
  });

  useEffect(() => {
    if (!enabled || !householdOwnerId) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let subscribing = false;
    let subscribed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function clearRetry() {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    function mergeUpsert(items: ShoppingListItem[], row: ListRow): ShoppingListItem[] {
      const incoming = listRowToItem(row);
      positionsRef.current.set(row.id, row.position);
      const idx = items.findIndex((i) => i.id === incoming.id);
      if (idx >= 0) {
        const existing = items[idx];
        if (rowsEqual(existing, incoming)) return items;
        const next = items.slice();
        next[idx] = { ...existing, ...incoming };
        return sortByPosition(next, positionsRef.current);
      }
      return sortByPosition([...items, incoming], positionsRef.current);
    }

    function mergeDelete(items: ShoppingListItem[], id: string): ShoppingListItem[] {
      if (!items.some((i) => i.id === id)) return items;
      positionsRef.current.delete(id);
      return items.filter((i) => i.id !== id);
    }

    async function teardownChannel() {
      if (!channel) return;
      const toRemove = channel;
      channel = null;
      subscribed = false;
      try {
        await supabase.removeChannel(toRemove);
      } catch {
        // Channel may not have finished connecting — safe to ignore.
      }
    }

    async function ensureRealtimeAuth(): Promise<boolean> {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return false;
      supabase.realtime.setAuth(session.access_token);
      return true;
    }

    async function subscribeChannel() {
      if (cancelled || subscribing) return;
      if (subscribed && channel) return;

      subscribing = true;
      clearRetry();

      try {
        const authed = await ensureRealtimeAuth();
        if (cancelled || !authed) return;

        await teardownChannel();

        const filter = `user_id=eq.${householdOwnerId}`;
        const base = {
          schema: "public" as const,
          table: "shopping_list_items" as const,
          filter,
        };

        channel = supabase
          .channel(`shopping_list:household=${householdOwnerId}`)
          .on("postgres_changes", { event: "INSERT", ...base }, (payload) => {
            patchItemsRef.current((items) =>
              mergeUpsert(items, payload.new as ListRow),
            );
          })
          .on("postgres_changes", { event: "UPDATE", ...base }, (payload) => {
            patchItemsRef.current((items) =>
              mergeUpsert(items, payload.new as ListRow),
            );
          })
          .on("postgres_changes", { event: "DELETE", ...base }, (payload) => {
            const id = (payload.old as Pick<ListRow, "id">).id;
            if (!id) return;
            patchItemsRef.current((items) => mergeDelete(items, id));
          })
          .subscribe((status) => {
            if (cancelled) return;
            if (status === "SUBSCRIBED") {
              subscribed = true;
              return;
            }
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              subscribed = false;
              retryTimer = setTimeout(() => {
                void subscribeChannel();
              }, 3000);
            }
          });
      } finally {
        subscribing = false;
      }
    }

    function onAuthReady(accessToken: string) {
      if (cancelled) return;
      supabase.realtime.setAuth(accessToken);
      void subscribeChannel();
    }

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session?.access_token) return;
      if (event === "TOKEN_REFRESHED") {
        supabase.realtime.setAuth(session.access_token);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        onAuthReady(session.access_token);
      }
    });

    // Bootstrap when the listener is registered after INITIAL_SESSION already fired.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        onAuthReady(session.access_token);
      }
    });

    return () => {
      cancelled = true;
      clearRetry();
      authSub.unsubscribe();
      void teardownChannel();
    };
  }, [enabled, householdOwnerId, positionsRef]);
}
