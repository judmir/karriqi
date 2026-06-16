import { addDays, format } from "date-fns";

import {
  parseRecurrenceRule,
  serializeRecurrenceRule,
} from "@/lib/rehab/recurrence";
import { STOIC_BLOCKS } from "@/modules/rehab/neuro-rehab-2026/stoic-content";
import {
  NEURO_REHAB_PROGRAM_ID,
  PROGRAM_START,
  PROGRAM_WEEKS,
} from "@/modules/rehab/neuro-rehab-2026/constants";

export type StoicRow = {
  id: string;
  start_at: string;
  end_at: string;
  event_kind: string;
  program_id: string | null;
  series_id: string | null;
  recurrence_rule: string | null;
  recurrence_at: string | null;
  recurrence_cancelled: boolean;
  completed_at: string | null;
};

export type StoicPatch = {
  id: string;
  start_at?: string;
  end_at?: string;
  recurrence_rule?: string | null;
};

export type StoicFixPlan = {
  updates: StoicPatch[];
  deleteOverrideIds: string[];
};

function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function isDailyMaster(row: StoicRow): boolean {
  if (row.recurrence_at || !row.recurrence_rule) {
    return false;
  }
  const rule = parseRecurrenceRule(row.recurrence_rule);
  return rule?.freq === "daily";
}

function isWeeklyMaster(row: StoicRow): boolean {
  if (row.recurrence_at || !row.recurrence_rule) {
    return false;
  }
  const rule = parseRecurrenceRule(row.recurrence_rule);
  return rule?.freq === "weekly";
}

/** Expected daily + weekly stoic masters from the Jun 14 program anchor. */
export function expectedStoicMasters(): Array<{
  start_at: string;
  until: string;
  freq: "daily" | "weekly";
}> {
  const expected: Array<{
    start_at: string;
    until: string;
    freq: "daily" | "weekly";
  }> = [];

  for (const block of STOIC_BLOCKS) {
    const blockStart = addDays(PROGRAM_START, (block.startWeek - 1) * 7);
    const blockEnd = addDays(blockStart, 13);
    blockStart.setHours(7, 40, 0, 0);
    expected.push({
      start_at: blockStart.toISOString(),
      until: toDateOnly(blockEnd),
      freq: "daily",
    });
  }

  const firstSundayOffset = (7 - PROGRAM_START.getDay()) % 7;
  const firstSunday = addDays(PROGRAM_START, firstSundayOffset);
  firstSunday.setHours(19, 30, 0, 0);
  const programEnd = addDays(
    PROGRAM_START,
    PROGRAM_WEEKS * 7 + 6 - 1,
  );
  expected.push({
    start_at: firstSunday.toISOString(),
    until: toDateOnly(programEnd),
    freq: "weekly",
  });

  return expected;
}

export function buildStoicFixPlan(rows: StoicRow[]): StoicFixPlan {
  const stoicRows = rows.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID && row.event_kind === "stoic",
  );

  const updates: StoicPatch[] = [];
  const deleteOverrideIds: string[] = [];

  const dailyMasters = stoicRows.filter(isDailyMaster);
  const weeklyMasters = stoicRows.filter(isWeeklyMaster);
  const expected = expectedStoicMasters();
  const expectedDaily = expected.filter((row) => row.freq === "daily");
  const expectedWeekly = expected.filter((row) => row.freq === "weekly");

  const sortedDailyMasters = [...dailyMasters].sort((a, b) =>
    a.start_at.localeCompare(b.start_at),
  );

  sortedDailyMasters.forEach((master, index) => {
    const target = expectedDaily[index];
    if (!target) {
      deleteOverrideIds.push(master.id);
      return;
    }
    const rule = parseRecurrenceRule(master.recurrence_rule);
    const nextRule = serializeRecurrenceRule({
      freq: "daily",
      interval: 1,
      until: target.until,
    });
    const duration =
      new Date(master.end_at).getTime() - new Date(master.start_at).getTime();
    const nextEnd = new Date(
      new Date(target.start_at).getTime() + duration,
    ).toISOString();

    if (
      master.start_at !== target.start_at ||
      master.end_at !== nextEnd ||
      master.recurrence_rule !== nextRule
    ) {
      updates.push({
        id: master.id,
        start_at: target.start_at,
        end_at: nextEnd,
        recurrence_rule: nextRule,
      });
    }
    void rule;
  });

  const weeklyMaster = weeklyMasters[0];
  const weeklyTarget = expectedWeekly[0];
  for (const extra of weeklyMasters.slice(1)) {
    deleteOverrideIds.push(extra.id);
  }
  if (weeklyMaster && weeklyTarget) {
    const nextRule = serializeRecurrenceRule({
      freq: "weekly",
      interval: 1,
      weekdays: [0],
      until: weeklyTarget.until,
    });
    const duration =
      new Date(weeklyMaster.end_at).getTime() -
      new Date(weeklyMaster.start_at).getTime();
    const nextEnd = new Date(
      new Date(weeklyTarget.start_at).getTime() + duration,
    ).toISOString();

    if (
      weeklyMaster.start_at !== weeklyTarget.start_at ||
      weeklyMaster.end_at !== nextEnd ||
      weeklyMaster.recurrence_rule !== nextRule
    ) {
      updates.push({
        id: weeklyMaster.id,
        start_at: weeklyTarget.start_at,
        end_at: nextEnd,
        recurrence_rule: nextRule,
      });
    }
  }

  for (const row of stoicRows) {
    if (!row.recurrence_at) {
      continue;
    }
    if (row.completed_at) {
      continue;
    }
    deleteOverrideIds.push(row.id);
  }

  return { updates, deleteOverrideIds };
}
