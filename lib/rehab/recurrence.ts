import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  getDay,
  parseISO,
} from "date-fns";

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceRule = {
  freq: RecurrenceFreq;
  /** "Repeat every N ...". Always >= 1. */
  interval: number;
  /** Weekly only: weekdays as date-fns getDay() values (0 = Sun … 6 = Sat). */
  weekdays?: number[];
  /** ISO date (inclusive). null/undefined = never (callers cap by window). */
  until?: string | null;
};

export type RecurrenceOccurrence = {
  /** Original occurrence start (the recurrence identity). */
  occurrenceAt: string;
  startAt: string;
  endAt: string;
};

const FREQ_VALUES = new Set<RecurrenceFreq>([
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

/** Hard guard against runaway loops for "never"-ending rules. */
const MAX_OCCURRENCES = 730;

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const WEEKDAY_FULL = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
/** Display order Monday-first (date-fns getDay values). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const FREQ_NOUN: Record<RecurrenceFreq, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

function isFreq(value: unknown): value is RecurrenceFreq {
  return typeof value === "string" && FREQ_VALUES.has(value as RecurrenceFreq);
}

function normalizeWeekdays(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const days = Array.from(
    new Set(
      value.filter(
        (day): day is number =>
          typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6,
      ),
    ),
  ).sort((a, b) => a - b);
  return days.length > 0 ? days : undefined;
}

export function parseRecurrenceRule(
  raw: string | null | undefined,
): RecurrenceRule | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (!isFreq(record.freq)) {
      return null;
    }
    const interval =
      typeof record.interval === "number" &&
      Number.isFinite(record.interval) &&
      record.interval >= 1
        ? Math.floor(record.interval)
        : 1;
    const weekdays =
      record.freq === "weekly" ? normalizeWeekdays(record.weekdays) : undefined;
    const until =
      typeof record.until === "string" && record.until.length > 0
        ? record.until
        : null;

    return { freq: record.freq, interval, weekdays, until };
  } catch {
    return null;
  }
}

export function serializeRecurrenceRule(
  rule: RecurrenceRule | null | undefined,
): string | null {
  if (!rule || !isFreq(rule.freq)) {
    return null;
  }
  const interval =
    Number.isFinite(rule.interval) && rule.interval >= 1
      ? Math.floor(rule.interval)
      : 1;
  const payload: RecurrenceRule = { freq: rule.freq, interval };

  if (rule.freq === "weekly") {
    const weekdays = normalizeWeekdays(rule.weekdays);
    if (weekdays) {
      payload.weekdays = weekdays;
    }
  }
  if (rule.until) {
    payload.until = rule.until;
  }

  return JSON.stringify(payload);
}

export function rulesEqual(
  a: RecurrenceRule | null | undefined,
  b: RecurrenceRule | null | undefined,
): boolean {
  return serializeRecurrenceRule(a ?? null) === serializeRecurrenceRule(b ?? null);
}

function addInterval(date: Date, rule: RecurrenceRule): Date {
  switch (rule.freq) {
    case "daily":
      return addDays(date, rule.interval);
    case "weekly":
      return addWeeks(date, rule.interval);
    case "monthly":
      return addMonths(date, rule.interval);
    case "yearly":
      return addYears(date, rule.interval);
  }
}

/**
 * For weekly rules with selected weekdays, yields each selected weekday within
 * the active week (anchored to dtstart's week), preserving dtstart's time.
 */
function* weeklyOccurrences(
  dtstart: Date,
  rule: RecurrenceRule,
  hardEnd: Date,
): Generator<Date> {
  const weekdays =
    rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [getDay(dtstart)];
  const ordered = [...weekdays].sort((a, b) => a - b);

  // Start from the Sunday of dtstart's week so weekday math is stable.
  let weekStart = addDays(dtstart, -getDay(dtstart));
  let guard = 0;
  while (weekStart <= hardEnd && guard < MAX_OCCURRENCES) {
    for (const weekday of ordered) {
      const occ = setTimeFrom(addDays(weekStart, weekday), dtstart);
      if (occ >= dtstart && occ <= hardEnd) {
        yield occ;
      }
    }
    weekStart = addWeeks(weekStart, rule.interval);
    guard += 1;
  }
}

function setTimeFrom(date: Date, source: Date): Date {
  const next = new Date(date);
  next.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );
  return next;
}

/**
 * Expand a recurrence rule into concrete occurrences overlapping
 * [windowStart, windowEnd]. dtstart is the first occurrence (master start).
 */
export function expandRule(
  rule: RecurrenceRule,
  dtstart: Date,
  durationMs: number,
  windowStart: Date,
  windowEnd: Date,
): RecurrenceOccurrence[] {
  const untilEnd = rule.until ? endOfDay(parseISO(rule.until)) : null;
  const hardEnd = untilEnd && untilEnd < windowEnd ? untilEnd : windowEnd;
  const occurrences: RecurrenceOccurrence[] = [];

  const push = (start: Date) => {
    const end = new Date(start.getTime() + durationMs);
    // Overlaps window if it ends at/after windowStart.
    if (end >= windowStart && start <= hardEnd) {
      occurrences.push({
        occurrenceAt: start.toISOString(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
    }
  };

  if (rule.freq === "weekly") {
    for (const start of weeklyOccurrences(dtstart, rule, hardEnd)) {
      push(start);
      if (occurrences.length >= MAX_OCCURRENCES) {
        break;
      }
    }
    return occurrences;
  }

  let cursor = dtstart;
  let guard = 0;
  while (cursor <= hardEnd && guard < MAX_OCCURRENCES) {
    push(cursor);
    cursor = addInterval(cursor, rule);
    guard += 1;
  }
  return occurrences;
}

/** Short human label, e.g. "Daily", "Every 2 weeks on Mon, Wed". */
export function describeRecurrence(rule: RecurrenceRule | null | undefined): string {
  if (!rule) {
    return "Does not repeat";
  }
  const noun = FREQ_NOUN[rule.freq];
  const base =
    rule.interval === 1
      ? capitalize(adverb(rule.freq))
      : `Every ${rule.interval} ${noun}s`;

  if (rule.freq === "weekly" && rule.weekdays && rule.weekdays.length > 0) {
    const days = WEEKDAY_ORDER.filter((d) => rule.weekdays!.includes(d))
      .map((d) => WEEKDAY_FULL[d])
      .join(", ");
    return `${base} on ${days}`;
  }
  return base;
}

function adverb(freq: RecurrenceFreq): string {
  switch (freq) {
    case "daily":
      return "daily";
    case "weekly":
      return "weekly";
    case "monthly":
      return "monthly";
    case "yearly":
      return "yearly";
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
