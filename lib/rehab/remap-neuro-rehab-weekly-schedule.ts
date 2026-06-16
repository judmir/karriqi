import { addDays, differenceInMinutes, getDay, parseISO, startOfDay } from "date-fns";

import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";
/** Mon, Tue, Thu, Fri */
export const RUN_WEEKDAYS = [1, 2, 4, 5] as const;

/** Wed, Sat, Sun */
export const GYM_WEEKDAYS = [3, 6, 0] as const;

const GYM_KINDS = ["gym_a", "gym_b", "gym_c", "gym_d"] as const;

export const MAX_GYM_PER_WEEK = 3;
export const MAX_RUN_PER_WEEK = 4;

export type ScheduleRow = {
  id: string;
  start_at: string;
  end_at: string;
  event_kind: string;
  program_id: string | null;
  plan_week?: number | null;
  completed_at?: string | null;
};

export type SchedulePatch = {
  id: string;
  start_at: string;
  end_at: string;
};

function isGymKind(kind: string): boolean {
  return (GYM_KINDS as readonly string[]).includes(kind);
}

/** Program anchor date in UTC (matches stored event timestamps). */
const PROGRAM_START_UTC = {
  year: 2026,
  month: 5,
  day: 14,
} as const;

/** Sunday that starts the given plan week (week 1 = 14 Jun 2026 UTC). */
export function weekStartForPlanWeek(planWeek: number): Date {
  return new Date(
    Date.UTC(
      PROGRAM_START_UTC.year,
      PROGRAM_START_UTC.month,
      PROGRAM_START_UTC.day + (planWeek - 1) * 7,
    ),
  );
}

function groupKeyForRow(row: ScheduleRow): string {
  if (row.plan_week != null && row.plan_week >= 1) {
    return `plan:${row.plan_week}`;
  }
  return `cal:${weekSunday(parseISO(row.start_at)).toISOString()}`;
}

function weekStartForGroup(weekRows: ScheduleRow[]): Date {
  const planWeek = weekRows.find((row) => row.plan_week != null && row.plan_week >= 1)
    ?.plan_week;
  if (planWeek != null) {
    return weekStartForPlanWeek(planWeek);
  }
  return weekSunday(parseISO(weekRows[0]!.start_at));
}

function groupScheduleRows(rows: ScheduleRow[]): Map<string, ScheduleRow[]> {
  const byWeek = new Map<string, ScheduleRow[]>();
  for (const row of rows) {
    const key = groupKeyForRow(row);
    const list = byWeek.get(key) ?? [];
    list.push(row);
    byWeek.set(key, list);
  }
  return byWeek;
}

/** Sunday on or before the given date (program weeks are Sun-based). */
export function weekSunday(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -getDay(day));
}

function atWeekday(
  weekStartSunday: Date,
  weekday: number,
  source: Date,
): Date {
  return new Date(
    Date.UTC(
      weekStartSunday.getUTCFullYear(),
      weekStartSunday.getUTCMonth(),
      weekStartSunday.getUTCDate() + weekday,
      source.getUTCHours(),
      source.getUTCMinutes(),
      source.getUTCSeconds(),
      source.getUTCMilliseconds(),
    ),
  );
}

function withDuration(originalStart: Date, originalEnd: Date, newStart: Date): Date {
  const minutes = differenceInMinutes(originalEnd, originalStart);
  return new Date(newStart.getTime() + minutes * 60_000);
}

function preferredGymWeekday(kind: string): number {
  switch (kind) {
    case "gym_a":
      return 3;
    case "gym_b":
      return 6;
    case "gym_c":
      return 0;
    case "gym_d":
      return 6;
    default:
      return 3;
  }
}

function assignGymDays(
  gyms: ScheduleRow[],
  weekStartSunday: Date,
): Map<string, Date> {
  const assignments = new Map<string, Date>();
  const usedDays = new Set<number>();

  const byPreference = [...gyms].sort((a, b) => {
    const order = ["gym_a", "gym_b", "gym_c", "gym_d"];
    return order.indexOf(a.event_kind) - order.indexOf(b.event_kind);
  });

  for (const row of byPreference) {
    const preferred = preferredGymWeekday(row.event_kind);
    let weekday = preferred;
    if (usedDays.has(weekday)) {
      const fallback = GYM_WEEKDAYS.find((d) => !usedDays.has(d));
      if (fallback === undefined) {
        continue;
      }
      weekday = fallback;
    }
    usedDays.add(weekday);
    assignments.set(
      row.id,
      atWeekday(weekStartSunday, weekday, parseISO(row.start_at)),
    );
  }

  return assignments;
}

function assignRunDays(
  runs: ScheduleRow[],
  weekStartSunday: Date,
): Map<string, Date> {
  const assignments = new Map<string, Date>();
  const sorted = [...runs].sort(
    (a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime(),
  );

  sorted.forEach((row, index) => {
    const weekday = RUN_WEEKDAYS[index % RUN_WEEKDAYS.length]!;
    assignments.set(
      row.id,
      atWeekday(weekStartSunday, weekday, parseISO(row.start_at)),
    );
  });

  return assignments;
}

function gymKindRank(kind: string): number {
  const order = ["gym_a", "gym_b", "gym_c", "gym_d"];
  const index = order.indexOf(kind);
  return index === -1 ? order.length : index;
}

function keepPriority(row: ScheduleRow): number {
  if (row.completed_at) {
    return 0;
  }
  return 1;
}

/** Drop duplicate gym/run rows when a week has more than 3 gyms or 4 runs (migration tail overlap). */
export function buildWeeklyScheduleExcessDeleteIds(rows: ScheduleRow[]): string[] {
  const programRows = rows.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID &&
      (row.event_kind === "run_walk" || isGymKind(row.event_kind)),
  );

  const byWeek = groupScheduleRows(programRows);

  const deleteIds: string[] = [];

  for (const weekRows of byWeek.values()) {
    const gymsByKind = new Map<string, ScheduleRow>();
    for (const row of weekRows.filter((candidate) => isGymKind(candidate.event_kind))) {
      const existing = gymsByKind.get(row.event_kind);
      if (!existing) {
        gymsByKind.set(row.event_kind, row);
        continue;
      }
      const keepExisting = keepPriority(existing) <= keepPriority(row);
      deleteIds.push(keepExisting ? row.id : existing.id);
      if (!keepExisting) {
        gymsByKind.set(row.event_kind, row);
      }
    }

    const gyms = [...gymsByKind.values()].sort((a, b) => {
      const priority = keepPriority(a) - keepPriority(b);
      if (priority !== 0) {
        return priority;
      }
      return gymKindRank(a.event_kind) - gymKindRank(b.event_kind);
    });

    const runs = weekRows
      .filter((row) => row.event_kind === "run_walk")
      .sort((a, b) => {
        const priority = keepPriority(a) - keepPriority(b);
        if (priority !== 0) {
          return priority;
        }
        return parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime();
      });

    for (const row of gyms.slice(MAX_GYM_PER_WEEK)) {
      if (!deleteIds.includes(row.id)) {
        deleteIds.push(row.id);
      }
    }
    for (const row of runs.slice(MAX_RUN_PER_WEEK)) {
      if (!deleteIds.includes(row.id)) {
        deleteIds.push(row.id);
      }
    }
  }

  return deleteIds;
}

export function buildWeeklySchedulePatches(rows: ScheduleRow[]): SchedulePatch[] {
  const programRows = rows.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID &&
      (row.event_kind === "run_walk" || isGymKind(row.event_kind)),
  );

  const byWeek = groupScheduleRows(programRows);

  const patches: SchedulePatch[] = [];

  for (const weekRows of byWeek.values()) {
    const weekStart = weekStartForGroup(weekRows);
    const gyms = weekRows.filter((row) => isGymKind(row.event_kind));
    const runs = weekRows.filter((row) => row.event_kind === "run_walk");

    const gymTargets = assignGymDays(gyms, weekStart);
    const runTargets = assignRunDays(runs, weekStart);

    for (const row of weekRows) {
      const originalStart = parseISO(row.start_at);
      const originalEnd = parseISO(row.end_at);
      const target = gymTargets.get(row.id) ?? runTargets.get(row.id);
      if (!target) {
        continue;
      }
      const targetEnd = withDuration(originalStart, originalEnd, target);

      const nextStart = target.toISOString();
      const nextEnd = targetEnd.toISOString();

      patches.push({ id: row.id, start_at: nextStart, end_at: nextEnd });
    }
  }

  return patches;
}

export function countScheduleCollisions(rows: ScheduleRow[]): number {
  const kinds = rows.filter(
    (row) =>
      row.program_id === NEURO_REHAB_PROGRAM_ID &&
      (row.event_kind === "run_walk" || isGymKind(row.event_kind)),
  );
  const byDay = new Map<string, Set<string>>();
  for (const row of kinds) {
    const day = row.start_at.slice(0, 10);
    const set = byDay.get(day) ?? new Set();
    set.add(isGymKind(row.event_kind) ? "gym" : "run");
    byDay.set(day, set);
  }
  return [...byDay.values()].filter((set) => set.has("gym") && set.has("run"))
    .length;
}

/** Unique per-row temp bump so final weekday patches never hit dedupe unique index. */
export function buildUniqueTempBumpPatches(rows: ScheduleRow[]): SchedulePatch[] {
  const anchor = new Date(Date.UTC(2030, 0, 1));
  return rows.map((row, index) => {
    const start = parseISO(row.start_at);
    const end = parseISO(row.end_at);
    const duration = end.getTime() - start.getTime();
    const tempStart = addDays(anchor, index);
    tempStart.setUTCHours(
      start.getUTCHours(),
      start.getUTCMinutes(),
      start.getUTCSeconds(),
      start.getUTCMilliseconds(),
    );
    const tempEnd = new Date(tempStart.getTime() + duration);
    return {
      id: row.id,
      start_at: tempStart.toISOString(),
      end_at: tempEnd.toISOString(),
    };
  });
}
