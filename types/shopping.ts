/** ISO 8601 timestamp string (e.g. from DB or `toISOString()`). */
export type IsoDateString = string;

export type StapleItem = {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  /** Expected days between purchases; powers future interval nudges. */
  typicalIntervalDays?: number;
  /** Last time this staple was bought (mock in phase 1; persisted in phase 2). */
  lastPurchasedAt?: IsoDateString;
  createdAt: IsoDateString;
};

/** Active list row (phase 2); stub for typing and future list UI. */
export type ShoppingListItem = {
  id: string;
  stapleId?: string;
  name: string;
  quantity?: string;
  checked: boolean;
  addedAt: IsoDateString;
  /**
   * Profile color slug of whoever added this row (see PROFILE_COLORS in
   * `lib/profile/colors.ts`). Set when the row is first persisted and used
   * by the list UI to tint the row so household members can recognise who
   * added each item. Optional because legacy rows / mock data have none.
   */
  createdByColor?: string;
};
