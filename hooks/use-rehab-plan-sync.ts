"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";

const REALTIME_REFRESH_DEBOUNCE_MS = 400;

/**
 * Keep rehab events aligned with Supabase across PWA, browser tabs, and push
 * notification actions. Uses Realtime postgres_changes plus a visibility
 * refetch when the app resumes from background.
 */
export function useRehabPlanSync({ enabled }: { enabled: boolean }) {
  const refresh = useRehabPlanStore((state) => state.refresh);
  const persistence = useRehabPlanStore((state) => state.persistence);

  useEffect(() => {
    if (!enabled || !persistence) {
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleRefresh() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void refresh();
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let subscribing = false;
    let subscribed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let userId: string | null = null;

    function clearRetry() {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    async function teardownChannel() {
      if (!channel) {
        return;
      }
      const toRemove = channel;
      channel = null;
      subscribed = false;
      try {
        await supabase.removeChannel(toRemove);
      } catch {
        // Channel may not have finished connecting.
      }
    }

    async function ensureRealtimeAuth(): Promise<string | null> {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token || !session.user.id) {
        return null;
      }
      supabase.realtime.setAuth(session.access_token);
      return session.user.id;
    }

    async function subscribeChannel() {
      if (cancelled || subscribing) {
        return;
      }
      if (subscribed && channel) {
        return;
      }

      subscribing = true;
      clearRetry();

      try {
        const nextUserId = await ensureRealtimeAuth();
        if (cancelled || !nextUserId) {
          return;
        }
        userId = nextUserId;

        await teardownChannel();

        const filter = `user_id=eq.${userId}`;
        const base = {
          schema: "public" as const,
          table: "rehab_plan_events" as const,
          filter,
        };

        channel = supabase
          .channel(`rehab_plan_events:user=${userId}`)
          .on("postgres_changes", { event: "INSERT", ...base }, scheduleRefresh)
          .on("postgres_changes", { event: "UPDATE", ...base }, scheduleRefresh)
          .on("postgres_changes", { event: "DELETE", ...base }, scheduleRefresh)
          .subscribe((status) => {
            if (cancelled) {
              return;
            }
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

    function onAuthReady(accessToken: string, nextUserId: string) {
      if (cancelled) {
        return;
      }
      userId = nextUserId;
      supabase.realtime.setAuth(accessToken);
      void subscribeChannel();
    }

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session?.access_token || !session.user.id) {
        return;
      }
      if (event === "TOKEN_REFRESHED") {
        supabase.realtime.setAuth(session.access_token);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        onAuthReady(session.access_token, session.user.id);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token && session.user.id) {
        onAuthReady(session.access_token, session.user.id);
      }
    });

    return () => {
      cancelled = true;
      clearRetry();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      authSub.unsubscribe();
      void teardownChannel();
    };
  }, [enabled, persistence, refresh]);
}
