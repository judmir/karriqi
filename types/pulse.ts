export const PULSE_CATEGORIES = ["berlin_life"] as const;
export const PULSE_IMPACTS = ["low", "medium", "high"] as const;
export const PULSE_URGENCIES = ["watch", "this_month", "this_week", "now"] as const;
export const PULSE_STATUSES = ["new", "saved", "dismissed", "acted"] as const;
export const PULSE_SOURCE_TYPES = [
  "web",
  "document",
  "contract",
  "manual",
  "cron",
] as const;

export type PulseCategory = (typeof PULSE_CATEGORIES)[number];
export type PulseImpact = (typeof PULSE_IMPACTS)[number];
export type PulseUrgency = (typeof PULSE_URGENCIES)[number];
export type PulseStatus = (typeof PULSE_STATUSES)[number];
export type PulseSourceType = (typeof PULSE_SOURCE_TYPES)[number];

export type PulseFilter =
  | "all"
  | "new"
  | "saved"
  | "needs_action"
  | "high_impact"
  | "berlin_life";

export type PulseItem = {
  id: string;
  userId: string;
  title: string;
  summary: string;
  whyItMatters: string | null;
  suggestedAction: string | null;
  category: PulseCategory;
  impact: PulseImpact;
  urgency: PulseUrgency;
  status: PulseStatus;
  sourceType: PulseSourceType;
  sourceUrl: string | null;
  sourceTitle: string | null;
  startsAt: string | null;
  dueAt: string | null;
  expiresAt: string | null;
  dedupeKey: string;
  confidence: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export const PULSE_CATEGORY_LABELS: Record<PulseCategory, string> = {
  berlin_life: "Berlin Life",
};

export const PULSE_IMPACT_LABELS: Record<PulseImpact, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PULSE_URGENCY_LABELS: Record<PulseUrgency, string> = {
  watch: "Watch",
  this_month: "This month",
  this_week: "This week",
  now: "Now",
};

export const PULSE_STATUS_LABELS: Record<PulseStatus, string> = {
  new: "New",
  saved: "Saved",
  dismissed: "Dismissed",
  acted: "Acted",
};

export const PULSE_FILTER_LABELS: Record<PulseFilter, string> = {
  all: "All",
  new: "New",
  saved: "Saved",
  needs_action: "Needs action",
  high_impact: "High impact",
  berlin_life: "Berlin Life",
};

export function pulseItemNeedsAction(item: PulseItem): boolean {
  if (item.status === "dismissed" || item.status === "acted") {
    return false;
  }
  return item.urgency === "now" || item.urgency === "this_week";
}

export function filterPulseItems(
  items: PulseItem[],
  filter: PulseFilter,
): PulseItem[] {
  switch (filter) {
    case "all":
      return items.filter((item) => item.status !== "dismissed");
    case "new":
      return items.filter((item) => item.status === "new");
    case "saved":
      return items.filter((item) => item.status === "saved");
    case "needs_action":
      return items.filter(pulseItemNeedsAction);
    case "high_impact":
      return items.filter(
        (item) => item.impact === "high" && item.status !== "dismissed",
      );
    case "berlin_life":
      return items.filter(
        (item) =>
          item.category === "berlin_life" && item.status !== "dismissed",
      );
    default:
      return items;
  }
}
