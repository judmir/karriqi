"use client";

import { useEffect } from "react";

/**
 * Placeholder for notification subscription lifecycle.
 *
 * TODO (phase 2+): Supabase Realtime
 * - `supabase.channel('notifications:user:' + userId).on('postgres_changes', ...)`
 *
 * TODO (phase 3+): Web Push
 * - `Notification.requestPermission()` then `registration.pushManager.subscribe(...)`
 * - POST subscription to Edge Function; store server-side for targeted pushes
 *
 * TODO: Edge Function contract for sending push (VAPID, payload shape).
 */
export function useNotificationSubscription(_userId: string | null) {
  useEffect(() => {
    /* no-op in phase 1 */
  }, [_userId]);
}
