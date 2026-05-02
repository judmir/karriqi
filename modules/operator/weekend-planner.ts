import type { OperatorEntryRow } from "@/types/operator";
import {
  weekendPlannerPayloadSchema,
  type WeekendPlannerPayload,
} from "./weekend-planner-schema";

const WEEKEND_PLANNER_KIND = "weekend_planner" as const;

function isActiveWindow(
  row: OperatorEntryRow,
  nowMs: number,
): row is OperatorEntryRow & { starts_at: string; ends_at: string } {
  if (!row.starts_at || !row.ends_at) {
    return false;
  }
  const start = Date.parse(row.starts_at);
  const end = Date.parse(row.ends_at);
  return Number.isFinite(start) && Number.isFinite(end) && nowMs >= start && nowMs <= end;
}

function hasUpcomingStart(row: OperatorEntryRow, nowMs: number): row is OperatorEntryRow & {
  starts_at: string;
} {
  if (!row.starts_at) {
    return false;
  }
  const start = Date.parse(row.starts_at);
  return Number.isFinite(start) && start > nowMs;
}

/**
 * Picks the best weekend planner row for the dashboard from an in-memory list.
 *
 * Priority: (1) row whose [starts_at, ends_at] contains `now`, newest `updated_at`
 * if several; (2) nearest future `starts_at`; (3) newest `starts_at` (then `updated_at`).
 */
export function pickCurrentWeekendPlannerEntry(
  rows: OperatorEntryRow[],
  now: Date = new Date(),
): OperatorEntryRow | null {
  const nowMs = now.getTime();
  const planners = rows.filter((r) => r.kind === WEEKEND_PLANNER_KIND);

  const active = planners.filter((r) => isActiveWindow(r, nowMs));
  if (active.length > 0) {
    return active.sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    )[0]!;
  }

  const upcoming = planners.filter((r) => hasUpcomingStart(r, nowMs));
  if (upcoming.length > 0) {
    return upcoming.sort(
      (a, b) =>
        Date.parse(a.starts_at as string) - Date.parse(b.starts_at as string),
    )[0]!;
  }

  if (planners.length === 0) {
    return null;
  }

  return planners.sort((a, b) => {
    const sb = Date.parse(b.starts_at ?? "") - Date.parse(a.starts_at ?? "");
    if (sb !== 0) {
      return sb;
    }
    return Date.parse(b.updated_at) - Date.parse(a.updated_at);
  })[0]!;
}

/** Safely coerce stored JSON payload to a weekend planner payload, or fail closed. */
export function tryParseWeekendPlannerPayload(
  payload: unknown,
): WeekendPlannerPayload | null {
  const parsed = weekendPlannerPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}
