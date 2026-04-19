/**
 * Central tuning for habit-style “due soon” nudges.
 * Import from server and client (pure data).
 */
export const SHOPPING_SUGGESTION_RULES = {
  /** Fire when days since last purchase >= interval * buffer (e.g. 0.8 = 80% of typical interval). */
  dueSoonIntervalBuffer: 0.8,
  /** Cap how many due-soon chips we show. */
  maxDueSoonChips: 8,
  /** If staple has no typical_interval_days and no learned median, skip due-soon (avoid noisy defaults). */
  requireIntervalOrHistory: true,
  /** When we have history but no admin-set interval, floor median gap (days). */
  minLearnedIntervalDays: 2,
  /** When we have history but no admin-set interval, ceiling median gap (days). */
  maxLearnedIntervalDays: 60,
} as const;
