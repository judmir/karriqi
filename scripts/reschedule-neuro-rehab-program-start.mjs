#!/usr/bin/env node
/**
 * One-time reschedule: move neuro-rehab events from 8–13 Jun to the end of the
 * plan, Day 0 → 14 Jun, keep Jun 14+ on the same calendar days.
 *
 * Preserves row ids, completions, and descriptions — only shifts timestamps.
 *
 *   node scripts/reschedule-neuro-rehab-program-start.mjs
 *   node scripts/reschedule-neuro-rehab-program-start.mjs --dry-run
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PROGRAM_ID = "neuro-rehab-2026-v1";
const DEFER_TO_END_DAYS = 90;
const DAY0_SHIFT_DAYS = 6;
const OLD_PROGRAM_END = "2026-08-29";
const NEW_PROGRAM_END = "2026-09-11";

function loadEnvLocal(root) {
  const path = `${root}/.env.local`;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isDeferredWindowDay(day) {
  const start = startOfDay(new Date(2026, 5, 8));
  const end = startOfDay(new Date(2026, 5, 13));
  const value = startOfDay(day);
  return value >= start && value <= end;
}

function rescheduleDayShift(anchorAt, eventKind) {
  const day = startOfDay(new Date(anchorAt));
  if (!isDeferredWindowDay(day)) {
    return 0;
  }
  if (eventKind === "day0") {
    return DAY0_SHIFT_DAYS;
  }
  return DEFER_TO_END_DAYS;
}

function shiftUntilDate(until, startShift) {
  if (startShift === 0 && until === OLD_PROGRAM_END) {
    return NEW_PROGRAM_END;
  }
  if (startShift !== 0) {
    return formatDateOnly(addDays(new Date(until.slice(0, 10)), startShift));
  }
  return until;
}

function shiftTimestamp(iso, days) {
  if (days === 0) {
    return iso;
  }
  return addDays(new Date(iso), days).toISOString();
}

function buildPatch(row) {
  if (row.program_id !== PROGRAM_ID) {
    return null;
  }

  const startShift = rescheduleDayShift(row.start_at, row.event_kind);
  const recurrenceShift = row.recurrence_at
    ? rescheduleDayShift(row.recurrence_at, row.event_kind)
    : 0;

  let recurrenceRule = row.recurrence_rule;
  if (recurrenceRule) {
    try {
      const parsed = JSON.parse(recurrenceRule);
      if (parsed.until) {
        const nextUntil = shiftUntilDate(parsed.until, startShift);
        if (nextUntil !== parsed.until) {
          recurrenceRule = JSON.stringify({ ...parsed, until: nextUntil });
        }
      }
    } catch {
      // keep original
    }
  }

  const nextStart = shiftTimestamp(row.start_at, startShift);
  const nextEnd = shiftTimestamp(row.end_at, startShift);
  const nextRecurrenceAt = row.recurrence_at
    ? shiftTimestamp(row.recurrence_at, recurrenceShift)
    : null;

  if (
    nextStart === row.start_at &&
    nextEnd === row.end_at &&
    recurrenceRule === row.recurrence_rule &&
    nextRecurrenceAt === row.recurrence_at
  ) {
    return null;
  }

  return {
    id: row.id,
    start_at: nextStart,
    end_at: nextEnd,
    recurrence_rule: recurrenceRule,
    recurrence_at: nextRecurrenceAt,
  };
}

function isAlreadyRescheduled(rows) {
  const programRows = rows.filter((row) => row.program_id === PROGRAM_ID);
  const day0 = programRows.find((row) => row.event_kind === "day0");
  if (!day0 || day0.start_at.slice(0, 10) !== "2026-06-14") {
    return false;
  }
  return !programRows.some((row) => isDeferredWindowDay(new Date(row.start_at)));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const root = new URL("..", import.meta.url).pathname;
  loadEnvLocal(root);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local",
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("rehab_plan_events")
    .select(
      "id, start_at, end_at, event_kind, program_id, recurrence_rule, recurrence_at",
    )
    .eq("program_id", PROGRAM_ID);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    console.log("No neuro-rehab program events found — nothing to do.");
    return;
  }

  if (isAlreadyRescheduled(rows)) {
    console.log("Program already rescheduled (Day 0 on 14 Jun, 8–13 cleared).");
    return;
  }

  const patches = rows
    .map((row) => buildPatch(row))
    .filter((patch) => patch !== null);

  if (patches.length === 0) {
    console.log("No rows need rescheduling.");
    return;
  }

  console.log(
    `${dryRun ? "[dry-run] Would update" : "Updating"} ${patches.length} rehab_plan_events row(s)…`,
  );

  for (const patch of patches) {
    if (dryRun) {
      console.log(`  ${patch.id}: ${patch.start_at}`);
      continue;
    }

    const { error: updateError } = await admin
      .from("rehab_plan_events")
      .update({
        start_at: patch.start_at,
        end_at: patch.end_at,
        recurrence_rule: patch.recurrence_rule,
        recurrence_at: patch.recurrence_at,
      })
      .eq("id", patch.id);

    if (updateError) {
      throw new Error(`${patch.id}: ${updateError.message}`);
    }
  }

  console.log(
    dryRun
      ? "Dry run complete."
      : "Done. Reload Rehab in the app to see the new dates.",
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
