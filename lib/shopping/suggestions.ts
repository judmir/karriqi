import { SHOPPING_SUGGESTION_RULES } from "@/lib/shopping/suggestion-rules";
import type { PurchaseEventCadenceRow } from "@/lib/shopping/fetch-recent-purchase-events";
import type { StapleItem } from "@/types/shopping";

export type DueSoonSuggestion = {
  staple: StapleItem;
  /** Short line for title/tooltip, e.g. "Last bought 6d ago · ~every 7d" */
  detail: string;
  /** Sort key: higher = more overdue */
  urgency: number;
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

/** Median of gaps (days) between consecutive purchases, newest-first input per staple. */
export function medianGapDaysByStaple(
  events: PurchaseEventCadenceRow[],
): Record<string, number> {
  const byStaple = new Map<string, Date[]>();
  for (const row of events) {
    if (!row.staple_id) continue;
    const d = new Date(row.purchased_at);
    const list = byStaple.get(row.staple_id) ?? [];
    list.push(d);
    byStaple.set(row.staple_id, list);
  }

  const out: Record<string, number> = {};
  const { minLearnedIntervalDays, maxLearnedIntervalDays } =
    SHOPPING_SUGGESTION_RULES;

  for (const [stapleId, dates] of byStaple) {
    if (dates.length < 2) continue;
    dates.sort((x, y) => y.getTime() - x.getTime());
    const gaps: number[] = [];
    for (let i = 0; i < dates.length - 1; i++) {
      gaps.push(daysBetween(dates[i + 1], dates[i]));
    }
    gaps.sort((a, b) => a - b);
    const mid = Math.floor(gaps.length / 2);
    const median =
      gaps.length % 2 === 0
        ? Math.round((gaps[mid - 1]! + gaps[mid]!) / 2)
        : gaps[mid]!;
    const clamped = Math.min(
      maxLearnedIntervalDays,
      Math.max(minLearnedIntervalDays, median),
    );
    out[stapleId] = clamped;
  }

  return out;
}

export type RankDueSoonParams = {
  staples: StapleItem[];
  /** Staple ids already on the active list — excluded from nudges */
  excludeStapleIds: Set<string>;
  /** Optional learned cadence from purchase_events (days between buys) */
  medianIntervalByStapleId?: Record<string, number>;
  now?: Date;
};

/**
 * Staples that look “due soon” vs typical or learned interval.
 * Pure: safe on server and client.
 */
export function rankDueSoonStaples({
  staples,
  excludeStapleIds,
  medianIntervalByStapleId = {},
  now = new Date(),
}: RankDueSoonParams): DueSoonSuggestion[] {
  const {
    dueSoonIntervalBuffer,
    maxDueSoonChips,
    requireIntervalOrHistory,
  } = SHOPPING_SUGGESTION_RULES;

  const rows: DueSoonSuggestion[] = [];

  for (const staple of staples) {
    if (excludeStapleIds.has(staple.id)) continue;

    const typical = staple.typicalIntervalDays ?? undefined;
    const learned = medianIntervalByStapleId[staple.id];
    const effectiveInterval = typical ?? learned;

    if (requireIntervalOrHistory && effectiveInterval == null) continue;

    const intervalDays = effectiveInterval ?? 7;
    const lastRaw = staple.lastPurchasedAt;
    if (!lastRaw) continue;

    const last = new Date(lastRaw);
    const daysSince = daysBetween(last, now);
    const threshold = intervalDays * dueSoonIntervalBuffer;

    if (daysSince < threshold) continue;

    const urgency = daysSince - intervalDays;
    const cadenceLabel =
      typical != null
        ? `~every ${typical}d`
        : learned != null
          ? `~every ${learned}d (from history)`
          : `~every ${intervalDays}d`;
    const detail = `Last bought ${daysSince}d ago · ${cadenceLabel}`;

    rows.push({ staple, detail, urgency });
  }

  rows.sort((a, b) => b.urgency - a.urgency);
  return rows.slice(0, maxDueSoonChips);
}
