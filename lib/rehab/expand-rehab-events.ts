import { addDays, startOfDay } from "date-fns";

import { expandRule } from "@/lib/rehab/recurrence";
import type { RehabPlanEvent } from "@/types/rehab";

export type ExpandOptions = {
  /**
   * Don't emit virtual recurring occurrences older than this many days before
   * the window start, so old series don't pile up as "overdue". Real rows
   * (overrides/standalone) are unaffected.
   */
  overdueLookbackDays?: number;
};

const DEFAULT_OVERDUE_LOOKBACK_DAYS = 14;

function overlapsWindow(
  startAt: string,
  endAt: string,
  windowStart: Date,
  windowEnd: Date,
): boolean {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return end >= windowStart.getTime() && start <= windowEnd.getTime();
}

function isMaster(event: RehabPlanEvent): boolean {
  return event.recurrence !== null && event.recurrenceAt === null;
}

function isOverride(event: RehabPlanEvent): boolean {
  return event.recurrenceAt !== null;
}

/**
 * Build a synthetic id for a virtual (unmodified) occurrence of a master.
 * Format: "<masterId>::<occurrenceMs>".
 */
export function occurrenceId(masterId: string, occurrenceAt: string): string {
  return `${masterId}::${new Date(occurrenceAt).getTime()}`;
}

/** Parse a synthetic occurrence id back into its parts, or null if not one. */
export function parseOccurrenceId(
  id: string,
): { masterId: string; occurrenceMs: number } | null {
  const sep = id.indexOf("::");
  if (sep === -1) {
    return null;
  }
  const masterId = id.slice(0, sep);
  const occurrenceMs = Number(id.slice(sep + 2));
  if (!masterId || !Number.isFinite(occurrenceMs)) {
    return null;
  }
  return { masterId, occurrenceMs };
}

/**
 * Expand recurring masters into concrete occurrences for [windowStart, windowEnd],
 * applying per-occurrence overrides (edits / completion / skips). Non-recurring
 * events that overlap the window pass through unchanged.
 */
export function expandRehabEvents(
  events: RehabPlanEvent[],
  windowStart: Date,
  windowEnd: Date,
  options: ExpandOptions = {},
): RehabPlanEvent[] {
  const lookbackDays = options.overdueLookbackDays ?? DEFAULT_OVERDUE_LOOKBACK_DAYS;
  const virtualFloor = startOfDay(addDays(windowStart, -lookbackDays));

  const masters: RehabPlanEvent[] = [];
  const mastersBySeries = new Map<string, RehabPlanEvent>();
  const overrides: RehabPlanEvent[] = [];
  const overridesBySeries = new Map<string, Map<number, RehabPlanEvent>>();
  const standalone: RehabPlanEvent[] = [];
  const result: RehabPlanEvent[] = [];

  for (const event of events) {
    if (isMaster(event)) {
      masters.push(event);
      mastersBySeries.set(event.seriesId ?? event.id, event);
      continue;
    }
    if (isOverride(event) && event.seriesId) {
      overrides.push(event);
      const occMs = new Date(event.recurrenceAt!).getTime();
      let map = overridesBySeries.get(event.seriesId);
      if (!map) {
        map = new Map();
        overridesBySeries.set(event.seriesId, map);
      }
      map.set(occMs, event);
      continue;
    }
    standalone.push(event);
  }

  // Standalone (and malformed) rows pass through unchanged on overlap.
  for (const event of standalone) {
    if (overlapsWindow(event.startAt, event.endAt, windowStart, windowEnd)) {
      result.push(event);
    }
  }

  // Override rows: emit (with the master's rule attached for display/scope).
  for (const override of overrides) {
    if (override.recurrenceCancelled) {
      continue;
    }
    if (!overlapsWindow(override.startAt, override.endAt, windowStart, windowEnd)) {
      continue;
    }
    const master = override.seriesId
      ? mastersBySeries.get(override.seriesId)
      : undefined;
    result.push({
      ...override,
      recurrence: master?.recurrence ?? null,
      recurrenceMasterId: master?.id,
    });
  }

  for (const master of masters) {
    if (!master.recurrence) {
      continue;
    }
    const seriesKey = master.seriesId ?? master.id;
    const seriesOverrides = overridesBySeries.get(seriesKey);
    const dtstart = new Date(master.startAt);
    const durationMs = new Date(master.endAt).getTime() - dtstart.getTime();

    const occurrences = expandRule(
      master.recurrence,
      dtstart,
      durationMs,
      windowStart,
      windowEnd,
    );

    for (const occ of occurrences) {
      const occMs = new Date(occ.occurrenceAt).getTime();
      // An override row already represents this occurrence (emitted above).
      if (seriesOverrides?.has(occMs)) {
        continue;
      }
      // Suppress old virtual occurrences to avoid runaway overdue.
      if (new Date(occ.startAt) < virtualFloor) {
        continue;
      }
      result.push({
        ...master,
        id: occurrenceId(master.id, occ.occurrenceAt),
        startAt: occ.startAt,
        endAt: occ.endAt,
        completedAt: null,
        // Keep the rule for display; recurrenceAt marks this as an occurrence.
        recurrence: master.recurrence,
        recurrenceAt: occ.occurrenceAt,
        recurrenceMasterId: master.id,
      });
    }
  }

  return result;
}
