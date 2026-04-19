import { NextResponse } from "next/server";

import { ROUTES } from "@/config/routes";
import { sendWebPushToUserIds } from "@/lib/push/send-web-push";
import { createClient } from "@/lib/supabase/server";

/**
 * Sends one Web Push to the signed-in user’s registered devices (VAPID + subscriptions).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sentAt = new Date().toLocaleString();

  const result = await sendWebPushToUserIds([user.id], {
    title: "Karriqi test",
    body: `Push is working — ${sentAt}`,
    href: ROUTES.settings,
  });

  if (result.skipReason === "no_vapid") {
    return NextResponse.json(
      {
        ok: false,
        error: "VAPID keys are not configured on the server.",
        result,
      },
      { status: 503 },
    );
  }

  if (result.skipReason === "no_service_role") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Server cannot send push (missing SUPABASE_SERVICE_ROLE_KEY or Supabase URL).",
        result,
      },
      { status: 503 },
    );
  }

  if (result.skipReason === "no_subscriptions" || result.matchedSubscriptions === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No saved push subscription for this account. Use Enable notifications first, or sign in on the same origin where you registered.",
        result,
      },
      { status: 400 },
    );
  }

  if (result.skipReason === "db_error") {
    return NextResponse.json(
      { ok: false, error: "Could not load push subscriptions from the database.", result },
      { status: 500 },
    );
  }

  if (result.delivered === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Push endpoints rejected the message (check VAPID keys, or revoke and re-enable notifications).",
        result,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: result.delivered, result });
}
