import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";

import {
  parseRecurrenceRule,
  serializeRecurrenceRule,
} from "@/lib/rehab/recurrence";
import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";

/** Original program anchor (Mon 8 Jun 2026). */
export const RESCHEDULE_OLD_PROGRAM_START = new Date(2026, 5, 8);

/** Deferred calendar days moved to the end of the plan (inclusive). */
export const RESCHEDULE_DEFERRED_END = new Date(2026, 5, 13);

/** New program Day 0 (Sun 14 Jun 2026). */
export const RESCHEDULE_NEW_PROGRAM_START = new Date(2026, 5, 14);

/** Jun 8–13 content (except Day 0) lands at the end: +90 calendar days. */
export const RESCHEDULE_DEFER_TO_END_DAYS = 90;

/** Day 0 checklist moves from 8 Jun → 14 Jun. */
export const RESCHEDULE_DAY0_SHIFT_DAYS = 6;

const OLD_PROGRAM_END = "2026-08-29";
const NEW_PROGRAM_END = "2026-09-11";

export type RescheduleRow = {
  id: string;
  start_at: string;
  end_at: string;
  event_kind: string;
  program_id: string | null;
  recurrence_rule: string | null;
  recurrence_at: string | null;
};

export type ReschedulePatch = {
  id: string;
  start_at: string;
  end_at: string;
  recurrence_rule: string | null;
  recurrence_at: string | null;
};

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function isDeferredWindowDay(day: Date): boolean {
  const start = startOfDay(RESCHEDULE_OLD_PROGRAM_START);
  const end = startOfDay(RESCHEDULE_DEFERRED_END);
  const value = startOfDay(day);
  return value >= start && value <= end;
}

/** Calendar-day shift for one rehab row anchor (start_at or recurrence_at). */
export function rescheduleDayShift(
  anchorAt: string,
  eventKind: string,
): number {
  const day = startOfDay(new Date(anchorAt));
  if (!isDeferredWindowDay(day)) {
    return 0;
  }
  if (eventKind === "day0") {
    return RESCHEDULE_DAY0_SHIFT_DAYS;
  }
  return RESCHEDULE_DEFER_TO_END_DAYS;
}

function shiftUntilDate(until: string, startShift: number): string {
  if (startShift === 0 && until === OLD_PROGRAM_END) {
    return NEW_PROGRAM_END;
  }
  if (startShift !== 0) {
    return format(addDays(parseDateOnly(until), startShift), "yyyy-MM-dd");
  }
  return until;
}

function shiftTimestamp(iso: string, days: number): string {
  if (days === 0) {
    return iso;
  }
  return addDays(new Date(iso), days).toISOString();
}

export function buildReschedulePatch(row: RescheduleRow): ReschedulePatch | null {
  if (row.program_id !== NEURO_REHAB_PROGRAM_ID) {
    return null;
  }

  const startShift = rescheduleDayShift(row.start_at, row.event_kind);
  const recurrenceShift = row.recurrence_at
    ? rescheduleDayShift(row.recurrence_at, row.event_kind)
    : 0;

  let recurrenceRule = row.recurrence_rule;
  if (recurrenceRule) {
    const parsed = parseRecurrenceRule(recurrenceRule);
    if (parsed?.until) {
      const nextUntil = shiftUntilDate(parsed.until, startShift);
      if (nextUntil !== parsed.until) {
        recurrenceRule = serializeRecurrenceRule({ ...parsed, until: nextUntil });
      }
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

/** True when Day 0 is already on 14 Jun and nothing remains on 8–13 Jun. */
export function isProgramAlreadyRescheduled(rows: RescheduleRow[]): boolean {
  const programRows = rows.filter(
    (row) => row.program_id === NEURO_REHAB_PROGRAM_ID,
  );
  const day0 = programRows.find((row) => row.event_kind === "day0");
  if (!day0 || dateOnly(day0.start_at) !== "2026-06-14") {
    return false;
  }

  return !programRows.some((row) =>
    isDeferredWindowDay(new Date(row.start_at)),
  );
}

export function buildReschedulePatches(rows: RescheduleRow[]): ReschedulePatch[] {
  return rows
    .map((row) => buildReschedulePatch(row))
    .filter((patch): patch is ReschedulePatch => patch !== null);
}

/** Cloud program was shifted to a 1 Jul start; pull back to 14 Jun. */
export const RESCHEDULE_JUL1_ANCHOR = "2026-07-01";
export const RESCHEDULE_UNIFORM_JUL1_TO_JUN14_DAYS = -17;

function shiftRecurrenceUntil(until: string, days: number): string {
  return format(addDays(parseDateOnly(until), days), "yyyy-MM-dd");
}

/** Shift every timestamp on a row by the same number of days. */
export function buildUniformShiftPatch(
  row: RescheduleRow,
  days: number,
): ReschedulePatch | null {
  if (row.program_id !== NEURO_REHAB_PROGRAM_ID || days === 0) {
    return null;
  }

  let recurrenceRule = row.recurrence_rule;
  if (recurrenceRule) {
    const parsed = parseRecurrenceRule(recurrenceRule);
    if (parsed?.until) {
      const nextUntil = shiftRecurrenceUntil(parsed.until, days);
      if (nextUntil !== parsed.until) {
        recurrenceRule = serializeRecurrenceRule({ ...parsed, until: nextUntil });
      }
    }
  }

  const nextStart = shiftTimestamp(row.start_at, days);
  const nextEnd = shiftTimestamp(row.end_at, days);
  const nextRecurrenceAt = row.recurrence_at
    ? shiftTimestamp(row.recurrence_at, days)
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

/** Large temporary bump so uniform shifts avoid unique (start_at, event_kind) clashes. */
export const RESCHEDULE_TEMP_BUMP_DAYS = 400;

export function buildUniformShiftPatches(
  rows: RescheduleRow[],
  days: number,
): ReschedulePatch[] {
  return rows
    .map((row) => buildUniformShiftPatch(row, days))
    .filter((patch): patch is ReschedulePatch => patch !== null);
}

export function earliestProgramStart(rows: RescheduleRow[]): string | null {
  const programRows = rows.filter(
    (row) => row.program_id === NEURO_REHAB_PROGRAM_ID,
  );
  if (programRows.length === 0) {
    return null;
  }
  return programRows
    .map((row) => row.start_at)
    .sort((a, b) => a.localeCompare(b))[0]!;
}

/** Jul-start cloud rows with no June dates yet. */
export function needsUniformJul1ToJun14Shift(rows: RescheduleRow[]): boolean {
  if (isProgramAlreadyRescheduled(rows)) {
    return false;
  }
  const earliest = earliestProgramStart(rows);
  if (!earliest || !earliest.startsWith(RESCHEDULE_JUL1_ANCHOR)) {
    return false;
  }
  return !rows.some((row) =>
    isDeferredWindowDay(new Date(row.start_at)),
  );
}

/** Shift required so the earliest program row starts on 14 Jun. */
export function daysToAlignProgramStart(rows: RescheduleRow[]): number | null {
  const earliest = earliestProgramStart(rows);
  if (!earliest) {
    return null;
  }
  const diff = differenceInCalendarDays(
    startOfDay(RESCHEDULE_NEW_PROGRAM_START),
    startOfDay(new Date(earliest)),
  );
  return diff === 0 ? null : diff;
}

export function needsJuneDeferralShift(rows: RescheduleRow[]): boolean {
  if (isProgramAlreadyRescheduled(rows)) {
    return false;
  }
  return rows.some((row) =>
    row.program_id === NEURO_REHAB_PROGRAM_ID &&
    isDeferredWindowDay(new Date(row.start_at)),
  );
}

