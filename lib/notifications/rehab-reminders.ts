import { ROUTES } from "@/config/routes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import { createAdminClient } from "@/lib/supabase/admin";

/** Fire the reminder this many ms before a timed event's start. */
const LEAD_MS = 5 * 60 * 1000;

/**
 * Grace window so a slightly delayed cron run still fires (and we never send
 * reminders for events that already started more than this long ago).
 */
const GRACE_MS = 2 * 60 * 1000;

/**
 * Finds timed rehab plan events whose reminder time (start_at - 5 min) has
 * arrived, sends one Web Push per event to its owner, and stamps
 * `reminder_sent_at` so the next run skips it. Designed to be called every
 * minute by a secured cron. Caller must be authorized (e.g. cron secret).
 */
export async function runRehabReminderNotifications(): Promise<{
  notified: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { notified: 0 };

  const now = Date.now();
  const upperBound = new Date(now + LEAD_MS).toISOString();
  const lowerBound = new Date(now - GRACE_MS).toISOString();

  const { data: rows, error } = await admin
    .from("rehab_plan_events")
    .select("id, user_id, title, start_at")
    .eq("all_day", false)
    .is("completed_at", null)
    .is("reminder_sent_at", null)
    .gte("start_at", lowerBound)
    .lte("start_at", upperBound);

  if (error || !rows?.length) {
    if (error) console.error("[rehab-reminders] query failed:", error.message);
    return { notified: 0 };
  }

  let notified = 0;

  for (const row of rows) {
    if (!row.user_id) continue;

    const title = row.title?.trim() || "Rehab reminder";

    await dispatchNotification({
      kind: NOTIFICATION_KINDS.rehabReminder,
      recipientUserIds: [row.user_id],
      title,
      body: "Starting in 5 minutes",
      href: ROUTES.rehabToday,
      metadata: { rehab_plan_event_id: row.id },
    });

    const { error: upErr } = await admin
      .from("rehab_plan_events")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", row.id);

    if (!upErr) notified += 1;
    else console.error("[rehab-reminders] update failed:", upErr.message);
  }

  return { notified };
}
