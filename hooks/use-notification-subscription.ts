"use client";

import { useEffect } from "react";

/**
 * Reserved for in-app notification UX hooks (e.g. Supabase Realtime on
 * `notifications` inserts). Web Push subscription is requested from Settings
 * (user gesture) via `PushNotificationsSettings`.
 */
export function useNotificationSubscription(_userId: string | null) {
  useEffect(() => {
    // Reserved: Supabase Realtime `notifications` channel keyed by user id.
  }, [_userId]);
}
