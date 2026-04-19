import webPush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

function vapidConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim(),
  );
}

export async function sendWebPushToUserIds(
  userIds: string[],
  payload: { title: string; body: string; href?: string },
): Promise<void> {
  if (!vapidConfigured() || userIds.length === 0) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY!.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() ?? "mailto:noreply@example.com";

  webPush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createAdminClient();
  if (!admin) return;

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error || !subs?.length) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href ?? "/",
  });

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
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("[web-push] send failed:", err);
      }
    }
  }
}
