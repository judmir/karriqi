export const RULE_OF_3_POSITIONS = [1, 2, 3] as const;

export type RuleOf3Position = (typeof RULE_OF_3_POSITIONS)[number];

/** Slot framing: one deep-work win, one progress win, one thing to protect. */
export const RULE_OF_3_SLOT_LABELS: Record<RuleOf3Position, string> = {
  1: "Must finish",
  2: "Must progress",
  3: "Must protect",
};

export const RULE_OF_3_SLOT_HINTS: Record<RuleOf3Position, string> = {
  1: "The one deep-work outcome that defines a successful day.",
  2: "Move an important project meaningfully forward.",
  3: "Protect health, family, or discipline.",
};

export type RuleOf3Item = {
  /** Synthetic client id: `${planDate}#${position}`. */
  id: string;
  position: RuleOf3Position;
  title: string;
  notes: string;
  completedAt: string | null;
  blockedReason: string;
};

export type RuleOf3Day = {
  /** Synthetic client id equal to planDate for stable keys. */
  id: string;
  planDate: string;
  reflection: string;
  items: RuleOf3Item[];
  createdAt: string | null;
  updatedAt: string | null;
};

/** A rendered slot for a given position; may be empty (no title yet). */
export type RuleOf3Slot = {
  position: RuleOf3Position;
  label: string;
  hint: string;
  item: RuleOf3Item | null;
};

export type RuleOf3ItemStatus = "open" | "done" | "blocked";
