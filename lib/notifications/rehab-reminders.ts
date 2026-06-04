import { ROUTES } from "@/config/routes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import { expandRule, parseRecurrenceRule } from "@/lib/rehab/recurrence";
import { createAdminClient } from "@/lib/supabase/admin";

/** Fire the reminder this many ms before a timed event's start. */
const LEAD_MS = 5 * 60 * 1000;

/**
 * Grace window so a slightly delayed cron run still fires (and we never send
 * reminders for events that already started more than this long ago).
 */
const GRACE_MS = 2 * 60 * 1000;

type ReminderCandidate = {
  userId: string;
  title: string;
  /** Concrete row id (standalone/override) or recurring master id. */
  eventId: string;
  /** Occurrence start ISO; identity for recurring dedupe. */
  occurrenceAt: string;
};

/**
 * Sends a Web Push ~5 minutes before each timed rehab event occurrence and
 * records that it was sent so it never repeats. Covers:
 *   - standalone timed rows and per-occurrence override rows (dedupe via
 *     rehab_plan_events.reminder_sent_at), and
 *   - every occurrence of recurring masters, which are virtual (not stored)
 *     and dedupe via the rehab_event_reminders table.
 * Designed to be called every minute by a secured cron. Caller must be
 * authorized (e.g. cron secret).
 */
export async function runRehabReminderNotifications(): Promise<{
  notified: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { notified: 0 };

  const now = Date.now();
  const lowerMs = now - GRACE_MS;
  const upperMs = now + LEAD_MS;
  const lowerBound = new Date(lowerMs).toISOString();
  const upperBound = new Date(upperMs).toISOString();

  const candidates: ReminderCandidate[] = [];
  const concreteRowIdsToStamp: string[] = [];

  // 1) Concrete rows: standalone events + per-occurrence override rows.
  //    Recurring masters are excluded here (recurrence_rule is null) and handled
  //    by expansion below, so the first occurrence is never sent twice.
  const { data: concreteRows, error: concreteError } = await admin
    .from("rehab_plan_events")
    .select("id, user_id, title, start_at")
    .is("recurrence_rule", null)
    .eq("all_day", false)
    .eq("recurrence_cancelled", false)
    .is("completed_at", null)
    .is("reminder_sent_at", null)
    .gte("start_at", lowerBound)
    .lte("start_at", upperBound);

  if (concreteError) {
    console.error("[rehab-reminders] concrete query failed:", concreteError.message);
  } else {
    for (const row of concreteRows ?? []) {
      if (!row.user_id) continue;
      candidates.push({
        userId: row.user_id,
        title: row.title?.trim() || "Rehab reminder",
        eventId: row.id,
        occurrenceAt: row.start_at,
      });
      concreteRowIdsToStamp.push(row.id);
    }
  }

  // 2) Recurring masters: expand into the reminder window.
  const { data: masters, error: mastersError } = await admin
    .from("rehab_plan_events")
    .select("id, user_id, title, start_at, end_at, recurrence_rule, series_id")
    .not("recurrence_rule", "is", null)
    .eq("all_day", false);

  if (mastersError) {
    console.error("[rehab-reminders] masters query failed:", mastersError.message);
  } else if (masters && masters.length > 0) {
    // Overrides whose original occurrence falls in the window: skip those grid
    // occurrences (the override row itself is handled by step 1, or is a
    // cancellation/completion).
    const { data: overrideRows, error: overrideError } = await admin
      .from("rehab_plan_events")
      .select("series_id, recurrence_at")
      .not("recurrence_at", "is", null)
      .gte("recurrence_at", lowerBound)
      .lte("recurrence_at", upperBound);

    if (overrideError) {
      console.error("[rehab-reminders] overrides query failed:", overrideError.message);
    }

    const overrideKeys = new Set<string>();
    for (const row of overrideRows ?? []) {
      if (!row.series_id || !row.recurrence_at) continue;
      overrideKeys.add(`${row.series_id}:${new Date(row.recurrence_at).getTime()}`);
    }

    // Occurrences already pushed (dedupe), bounded to the window.
    const { data: sentRows, error: sentError } = await admin
      .from("rehab_event_reminders")
      .select("master_id, occurrence_at")
      .gte("occurrence_at", lowerBound)
      .lte("occurrence_at", upperBound);

    if (sentError) {
      console.error("[rehab-reminders] dedupe query failed:", sentError.message);
    }

    const sentKeys = new Set<string>();
    for (const row of sentRows ?? []) {
      sentKeys.add(`${row.master_id}:${new Date(row.occurrence_at).getTime()}`);
    }

    const windowStart = new Date(lowerMs);
    const windowEnd = new Date(upperMs);

    for (const master of masters) {
      if (!master.user_id) continue;
      const rule = parseRecurrenceRule(master.recurrence_rule);
      if (!rule) continue;

      const dtstart = new Date(master.start_at);
      const durationMs =
        new Date(master.end_at).getTime() - dtstart.getTime();
      const seriesKey = master.series_id ?? master.id;

      const occurrences = expandRule(
        rule,
        dtstart,
        Number.isFinite(durationMs) ? durationMs : 0,
        windowStart,
        windowEnd,
      );

      for (const occ of occurrences) {
        const occMs = new Date(occ.startAt).getTime();
        // Only reminders for occurrences whose start is inside the window.
        if (occMs < lowerMs || occMs > upperMs) continue;
        if (overrideKeys.has(`${seriesKey}:${occMs}`)) continue;
        if (sentKeys.has(`${master.id}:${occMs}`)) continue;

        candidates.push({
          userId: master.user_id,
          title: master.title?.trim() || "Rehab reminder",
          eventId: master.id,
          occurrenceAt: occ.startAt,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return { notified: 0 };
  }

  let notified = 0;

  for (const candidate of candidates) {
    await dispatchNotification({
      kind: NOTIFICATION_KINDS.rehabReminder,
      recipientUserIds: [candidate.userId],
      title: candidate.title,
      body: "Starting in 5 minutes",
      href: ROUTES.rehabToday,
      metadata: {
        rehab_plan_event_id: candidate.eventId,
        occurrence_at: candidate.occurrenceAt,
      },
    });
    notified += 1;
  }

  // Record sends so they never repeat. Concrete rows stamp reminder_sent_at;
  // recurring occurrences insert into the dedupe table.
  const nowIso = new Date().toISOString();

  if (concreteRowIdsToStamp.length > 0) {
    const { error: stampError } = await admin
      .from("rehab_plan_events")
      .update({ reminder_sent_at: nowIso })
      .in("id", concreteRowIdsToStamp);
    if (stampError) {
      console.error("[rehab-reminders] stamp failed:", stampError.message);
    }
  }

  const dedupeRows = candidates
    .filter((candidate) => !concreteRowIdsToStamp.includes(candidate.eventId))
    .map((candidate) => ({
      master_id: candidate.eventId,
      occurrence_at: candidate.occurrenceAt,
    }));

  if (dedupeRows.length > 0) {
    const { error: insertError } = await admin
      .from("rehab_event_reminders")
      .upsert(dedupeRows, { onConflict: "master_id,occurrence_at" });
    if (insertError) {
      console.error("[rehab-reminders] dedupe insert failed:", insertError.message);
    }
  }

  return { notified };
}
