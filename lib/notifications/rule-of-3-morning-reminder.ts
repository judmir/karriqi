import { ROUTES } from "@/config/routes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import {
  dateStringInTimeZone,
  isLocalTimeInTimeZone,
  isTomorrowPlanningComplete,
  RULE_OF_3_REMINDER_TIMEZONE,
} from "@/lib/rule-of-3/rule-of-3-utils";
import { createAdminClient } from "@/lib/supabase/admin";

const MORNING_HOUR = 8;
const MORNING_MINUTE = 15;
const REMINDER_TITLE = "Rule of 3";

/**
 * At 08:15 (Europe/London), nudge users to set or focus on today's three priorities.
 * One push per user per calendar morning; skips users with no push subscription.
 * Designed for a daily secured cron (pg_cron + pg_net).
 */
export async function runRuleOf3MorningReminderNotifications(
  now: Date = new Date(),
): Promise<{ notified: number }> {
  if (!isLocalTimeInTimeZone(now, MORNING_HOUR, MORNING_MINUTE)) {
    return { notified: 0 };
  }

  const admin = createAdminClient();
  if (!admin) return { notified: 0 };

  const sentOn = dateStringInTimeZone(now);
  const todayDate = sentOn;

  const { data: subs, error: subsError } = await admin
    .from("push_subscriptions")
    .select("user_id");

  if (subsError) {
    console.error(
      "[rule-of-3-morning] push_subscriptions query failed:",
      subsError.message,
    );
    return { notified: 0 };
  }

  const userIds = [
    ...new Set((subs ?? []).map((row) => row.user_id).filter(Boolean)),
  ];
  if (userIds.length === 0) return { notified: 0 };

  let notified = 0;

  for (const userId of userIds) {
    const { data: alreadySent } = await admin
      .from("rule_of_3_morning_reminder_sends")
      .select("user_id")
      .eq("user_id", userId)
      .eq("sent_on", sentOn)
      .maybeSingle();

    if (alreadySent) continue;

    const progress = await countTodayProgress(admin, userId, todayDate);
    const body = morningReminderBody(progress);
    if (!body) continue;

    await dispatchNotification({
      kind: NOTIFICATION_KINDS.ruleOf3MorningReminder,
      recipientUserIds: [userId],
      title: REMINDER_TITLE,
      body,
      href: ROUTES.ruleOfThree,
      metadata: {
        plan_date: todayDate,
        sent_on: sentOn,
        timezone: RULE_OF_3_REMINDER_TIMEZONE,
        planned: progress.planned,
        done: progress.done,
      },
    });

    const { error: insertError } = await admin
      .from("rule_of_3_morning_reminder_sends")
      .insert({ user_id: userId, sent_on: sentOn });

    if (!insertError) {
      notified += 1;
    } else {
      console.error(
        "[rule-of-3-morning] dedupe insert failed:",
        insertError.message,
      );
    }
  }

  return { notified };
}

type TodayProgress = {
  planned: number;
  done: number;
};

function morningReminderBody(progress: TodayProgress): string | null {
  if (progress.done >= 3) {
    return null;
  }

  if (!isTomorrowPlanningComplete(progress.planned)) {
    const missing = 3 - progress.planned;
    return missing === 3
      ? "Set your 3 priorities for today before you dive in."
      : `Finish today's 3 — ${missing} slot${missing === 1 ? "" : "s"} still open.`;
  }

  if (progress.done === 0) {
    return "Stick to today's 3 — start with your first priority.";
  }

  return `Stick to today's 3 — ${progress.done} of 3 done.`;
}

async function countTodayProgress(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  planDate: string,
): Promise<TodayProgress> {
  const { data: dayRow, error: dayError } = await admin
    .from("rule_of_3_days")
    .select("id")
    .eq("user_id", userId)
    .eq("plan_date", planDate)
    .maybeSingle();

  if (dayError) {
    console.error("[rule-of-3-morning] day query failed:", dayError.message);
    return { planned: 0, done: 0 };
  }
  if (!dayRow?.id) return { planned: 0, done: 0 };

  const { data: items, error: itemsError } = await admin
    .from("rule_of_3_items")
    .select("title, completed_at")
    .eq("day_id", dayRow.id);

  if (itemsError) {
    console.error("[rule-of-3-morning] items query failed:", itemsError.message);
    return { planned: 0, done: 0 };
  }

  let planned = 0;
  let done = 0;

  for (const row of items ?? []) {
    if ((row.title ?? "").trim().length === 0) continue;
    planned += 1;
    if (row.completed_at) done += 1;
  }

  return { planned, done };
}
