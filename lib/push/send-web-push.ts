import { randomUUID } from "node:crypto";

import webPush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

function vapidConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim(),
  );
}

export type SendWebPushResult = {
  /** HTTP-accepted deliveries to push endpoints */
  delivered: number;
  /** Rows found in `push_subscriptions` for these users (may be 0). */
  matchedSubscriptions: number;
  /** True when `delivered === 0` */
  skipped: boolean;
  skipReason?:
    | "no_vapid"
    | "no_service_role"
    | "no_user_ids"
    | "db_error"
    | "no_subscriptions";
};

export async function sendWebPushToUserIds(
  userIds: string[],
  payload: { title: string; body: string; href?: string },
): Promise<SendWebPushResult> {
  if (!vapidConfigured()) {
    return {
      delivered: 0,
      matchedSubscriptions: 0,
      skipped: true,
      skipReason: "no_vapid",
    };
  }

  if (userIds.length === 0) {
    return {
      delivered: 0,
      matchedSubscriptions: 0,
      skipped: true,
      skipReason: "no_user_ids",
    };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY!.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() ?? "mailto:noreply@example.com";

  webPush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createAdminClient();
  if (!admin) {
    return {
      delivered: 0,
      matchedSubscriptions: 0,
      skipped: true,
      skipReason: "no_service_role",
    };
  }

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error) {
    console.error("[web-push] subscription query failed:", error.message);
    return {
      delivered: 0,
      matchedSubscriptions: 0,
      skipped: true,
      skipReason: "db_error",
    };
  }

  if (!subs?.length) {
    return {
      delivered: 0,
      matchedSubscriptions: 0,
      skipped: true,
      skipReason: "no_subscriptions",
    };
  }

  const body = JSON.stringify({
    /** Stable unique id: used as Notification `tag` so each push is distinct (not replaced). */
    id: randomUUID(),
    title: payload.title,
    body: payload.body,
    href: payload.href ?? "/",
  });

  let delivered = 0;

  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webPush.sendNotification(pushSub, body, {
        TTL: 86_400,
      });
      delivered += 1;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("[web-push] send failed:", err);
      }
    }
  }

  return {
    delivered,
    matchedSubscriptions: subs.length,
    skipped: delivered === 0,
    skipReason:
      delivered === 0 && subs.length === 0 ? "no_subscriptions" : undefined,
  };
}
