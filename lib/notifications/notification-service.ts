import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { Notification, NotificationListResult } from "./types";

function mapRow(row: {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
  read_at: string | null;
}): Notification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body ?? undefined,
    href: row.href ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at,
    priority: "normal",
    channels: ["in_app"],
  };
}

/**
 * Application-facing notification API backed by `public.notifications`.
 */
export type NotificationService = {
  listForUser: (userId: string) => Promise<NotificationListResult>;
  markRead: (userId: string, notificationId: string) => Promise<void>;
};

export function createNotificationService(
  supabase: SupabaseClient<Database>,
): NotificationService {
  return {
    async listForUser(userId: string): Promise<NotificationListResult> {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, body, href, created_at, read_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[notifications] list failed:", error.message);
        return { items: [] };
      }

      const items = (data ?? []).map((row) => mapRow(row));
      return { items };
    },

    async markRead(userId: string, notificationId: string): Promise<void> {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        console.error("[notifications] markRead failed:", error.message);
      }
    },
  };
}
