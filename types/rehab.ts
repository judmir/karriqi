import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import type { RecurrenceRule } from "@/lib/rehab/recurrence";

export const REHAB_EVENT_KINDS = [
  "gym_a",
  "gym_b",
  "gym_c",
  "gym_d",
  "run_walk",
  "hand",
  "speech",
  "football",
  "meditation",
  "journal",
  "supplement",
  "weekly_review",
  "retest",
  "day0",
  "recovery",
  "stoic",
  "custom",
] as const;

export type RehabEventKind = (typeof REHAB_EVENT_KINDS)[number];

export const NEURO_REHAB_PROGRAM_ID = "neuro-rehab-2026-v1";

export type RehabPlanEvent = CalendarEvent & {
  completedAt: string | null;
  eventKind: RehabEventKind;
  programId: string | null;
  planWeek: number | null;
  /** Groups a recurring master + its override rows. null for standalone events. */
  seriesId: string | null;
  /** Parsed recurrence rule. Only set on the master row of a series. */
  recurrence: RecurrenceRule | null;
  /** Override rows: the original occurrence start this row replaces. */
  recurrenceAt: string | null;
  /** Override rows: true to skip (EXDATE) this occurrence. */
  recurrenceCancelled: boolean;
  /**
   * Set on virtual (expanded) occurrences only: the master row id.
   * Real rows (master/override/standalone) leave this undefined.
   */
  recurrenceMasterId?: string;
};

export type RehabWikiPage = {
  slug: string;
  title: string;
  body: string;
  parentSlug: string | null;
  sortOrder: number;
};

export const REHAB_PLAN_CATALOG_KINDS = ["section", "task", "guide"] as const;

export type RehabPlanCatalogKind = (typeof REHAB_PLAN_CATALOG_KINDS)[number];

export type RehabPlanCatalogItem = {
  id: string;
  parentId: string | null;
  kind: RehabPlanCatalogKind;
  title: string;
  body: string;
  sortOrder: number;
};

export type RehabPlanListItem = RehabPlanCatalogItem & {
  completedAt: string | null;
  notes: string;
};

export type RehabPlanItemStateRow = {
  user_id: string;
  item_id: string;
  completed_at: string | null;
  notes: string;
  updated_at: string;
};

export const REHAB_CLINICAL_PHASES = ["before", "after"] as const;

export type RehabClinicalPhase = (typeof REHAB_CLINICAL_PHASES)[number];

export type RehabClinicalCatalogItem = {
  id: string;
  phase: RehabClinicalPhase;
  title: string;
  body: string;
  sortOrder: number;
  calendarEventKind: "day0" | "retest" | null;
};

export type RehabClinicalItem = RehabClinicalCatalogItem & {
  completedAt: string | null;
  notes: string;
  /** Indices of completed bullet subtasks from catalog body. */
  subtasksDone: number[];
};

export type RehabJournalEntry = {
  id: string;
  userId: string;
  entryDate: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type RehabPlanEventInsert = {
  /** Optional explicit id. Set for recurring masters so series_id can match. */
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  color?: CalendarEventColor;
  event_kind: RehabEventKind;
  program_id: string;
  plan_week: number;
  /** Recurring master: equals the row's own id. Standalone rows omit this. */
  series_id?: string | null;
  /** Serialized RecurrenceRule JSON for recurring masters. */
  recurrence_rule?: string | null;
  /** Override rows only; masters/standalone leave this null. */
  recurrence_at?: string | null;
};
