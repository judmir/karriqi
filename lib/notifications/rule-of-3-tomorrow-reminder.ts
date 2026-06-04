import { ROUTES } from "@/config/routes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import {
  dateStringInTimeZone,
  hourInTimeZone,
  isTomorrowPlanningComplete,
  RULE_OF_3_REMINDER_TIMEZONE,
  tomorrowDateStringInTimeZone,
} from "@/lib/rule-of-3/rule-of-3-utils";
import { createAdminClient } from "@/lib/supabase/admin";

const EVENING_HOUR = 21;
const REMINDER_TITLE = "Rule of 3";
const REMINDER_BODY =
  "Choose tomorrow's 3 before the day ends (21:00)";

/**
 * At 21:00 (Europe/London), nudge users who have not filled all three slots for
 * tomorrow. One push per user per calendar evening; skips users with no push
 * subscription. Designed for a daily secured cron (pg_cron + pg_net).
 */
export async function runRuleOf3TomorrowReminderNotifications(
  now: Date = new Date(),
): Promise<{ notified: number }> {
  if (hourInTimeZone(now) !== EVENING_HOUR) {
    return { notified: 0 };
  }

  const admin = createAdminClient();
  if (!admin) return { notified: 0 };

  const sentOn = dateStringInTimeZone(now);
  const tomorrowDate = tomorrowDateStringInTimeZone(now);

  const { data: subs, error: subsError } = await admin
    .from("push_subscriptions")
    .select("user_id");

  if (subsError) {
    console.error(
      "[rule-of-3-tomorrow] push_subscriptions query failed:",
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
      .from("rule_of_3_evening_reminder_sends")
      .select("user_id")
      .eq("user_id", userId)
      .eq("sent_on", sentOn)
      .maybeSingle();

    if (alreadySent) continue;

    const planned = await countPlannedItemsForDate(
      admin,
      userId,
      tomorrowDate,
    );
    if (isTomorrowPlanningComplete(planned)) continue;

    await dispatchNotification({
      kind: NOTIFICATION_KINDS.ruleOf3TomorrowReminder,
      recipientUserIds: [userId],
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      href: ROUTES.ruleOfThree,
      metadata: {
        plan_date: tomorrowDate,
        sent_on: sentOn,
        timezone: RULE_OF_3_REMINDER_TIMEZONE,
      },
    });

    const { error: insertError } = await admin
      .from("rule_of_3_evening_reminder_sends")
      .insert({ user_id: userId, sent_on: sentOn });

    if (!insertError) {
      notified += 1;
    } else {
      console.error(
        "[rule-of-3-tomorrow] dedupe insert failed:",
        insertError.message,
      );
    }
  }

  return { notified };
}

async function countPlannedItemsForDate(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  planDate: string,
): Promise<number> {
  const { data: dayRow, error: dayError } = await admin
    .from("rule_of_3_days")
    .select("id")
    .eq("user_id", userId)
    .eq("plan_date", planDate)
    .maybeSingle();

  if (dayError) {
    console.error("[rule-of-3-tomorrow] day query failed:", dayError.message);
    return 0;
  }
  if (!dayRow?.id) return 0;

  const { data: items, error: itemsError } = await admin
    .from("rule_of_3_items")
    .select("title")
    .eq("day_id", dayRow.id);

  if (itemsError) {
    console.error("[rule-of-3-tomorrow] items query failed:", itemsError.message);
    return 0;
  }

  return (items ?? []).filter((row) => (row.title ?? "").trim().length > 0)
    .length;
}
