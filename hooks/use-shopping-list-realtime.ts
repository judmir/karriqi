"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { useShoppingStore } from "@/stores/shopping-store";

type ListRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];

/**
 * Live-sync shopping list rows via Supabase Realtime (postgres_changes).
 * Updates flow through the Zustand store; pending local writes are ignored.
 */
export function useShoppingListRealtime({
  enabled,
  householdOwnerId,
}: {
  enabled: boolean;
  householdOwnerId: string | null;
}) {
  const applyRemoteUpsert = useShoppingStore((s) => s.applyRemoteUpsert);
  const applyRemoteDelete = useShoppingStore((s) => s.applyRemoteDelete);

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
            applyRemoteUpsert(payload.new as ListRow);
          })
          .on("postgres_changes", { event: "UPDATE", ...base }, (payload) => {
            applyRemoteUpsert(payload.new as ListRow);
          })
          .on("postgres_changes", { event: "DELETE", ...base }, (payload) => {
            const id = (payload.old as Pick<ListRow, "id">).id;
            if (!id) return;
            applyRemoteDelete(id);
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
  }, [enabled, householdOwnerId, applyRemoteUpsert, applyRemoteDelete]);
}
