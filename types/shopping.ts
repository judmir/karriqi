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
};
