import type { Json } from "@/types/database";

import { sendWebPushToUserIds } from "@/lib/push/send-web-push";
import { createAdminClient } from "@/lib/supabase/admin";

import type { NotificationKind } from "./kinds";

export type DispatchNotificationInput = {
  kind: NotificationKind;
  recipientUserIds: string[];
  title: string;
  body?: string;
  href?: string;
  metadata?: Json;
};

/**
 * Persists in-app rows (service role) and best-effort Web Push to each
 * recipient’s registered devices.
 */
export async function dispatchNotification(
  input: DispatchNotificationInput,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const recipientUserIds = [...new Set(input.recipientUserIds)].filter(Boolean);
  if (recipientUserIds.length === 0) return;

  const rows = recipientUserIds.map((user_id) => ({
    user_id,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    metadata: input.metadata ?? null,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    console.error("[notifications] insert failed:", error.message);
  }

  await sendWebPushToUserIds(recipientUserIds, {
    title: input.title,
    body: input.body ?? "",
    href: input.href,
  });
}
