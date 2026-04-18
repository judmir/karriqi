import type { NotificationListResult } from "./types";

/**
 * Application-facing notification API. Phase 1: no-op / local stubs only.
 *
 * Phase 2+: wire `listForUser` to Supabase (table + RLS) and optionally
 * Supabase Realtime on a channel such as `notifications:user:{userId}`.
 *
 * Phase 3+: web push via service worker subscription, VAPID keys, and a
 * Supabase Edge Function to send pushes (see `lib/push/README.md`).
 */
export type NotificationService = {
  listForUser: (userId: string) => Promise<NotificationListResult>;
  markRead: (userId: string, notificationId: string) => Promise<void>;
};

export function createNotificationService(): NotificationService {
  return {
    async listForUser() {
      return { items: [] };
    },
    async markRead() {
      /* intentionally empty */
    },
  };
}
