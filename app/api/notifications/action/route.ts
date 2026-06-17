import { NextResponse } from "next/server";
import { z } from "zod";

import { executeNotificationAction } from "@/lib/notifications/execute-notification-action";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import { PUSH_NOTIFICATION_ACTION } from "@/lib/notifications/push-actions";

const bodySchema = z.object({
  action: z.literal(PUSH_NOTIFICATION_ACTION.markComplete),
  kind: z.enum([
    NOTIFICATION_KINDS.rehabReminder,
    NOTIFICATION_KINDS.todoStale,
  ]),
  rehab_plan_event_id: z.string().uuid().optional(),
  occurrence_at: z.string().optional(),
  todo_item_id: z.string().uuid().optional(),
});

/**
 * Handles notification action buttons from the service worker (e.g. Mark as completed)
 * without opening the app. Requires an active session cookie.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid action payload." },
      { status: 400 },
    );
  }

  const result = await executeNotificationAction(parsed.data);
  if (!result.ok) {
    const status = result.message === "Not signed in." ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
