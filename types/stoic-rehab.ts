export const STOIC_REHAB_SUGGESTED_WHEN = [
  "morning",
  "before_rehab",
  "during_life",
  "evening",
] as const;

export type StoicRehabSuggestedWhen =
  (typeof STOIC_REHAB_SUGGESTED_WHEN)[number];

export const STOIC_REHAB_SLOTS = ["morning", "midday", "evening"] as const;

export type StoicRehabSlot = (typeof STOIC_REHAB_SLOTS)[number];

export const STOIC_CLASSICAL_VIRTUES = [
  "wisdom",
  "courage",
  "justice",
  "temperance",
] as const;

export type StoicClassicalVirtue = (typeof STOIC_CLASSICAL_VIRTUES)[number];

export const STOIC_REHAB_INTENSITIES = ["light", "medium"] as const;

export type StoicRehabIntensity = (typeof STOIC_REHAB_INTENSITIES)[number];

/** Process-score tags used in week summaries (legacy virtue buckets). */
export const STOIC_REHAB_VIRTUES = [
  "courage",
  "patience",
  "attention",
  "consistency",
] as const;

export type StoicRehabVirtue = (typeof STOIC_REHAB_VIRTUES)[number];

export type StoicRehabProcessScore = 0 | 1 | 2 | 3;

export type StoicRehabExercise = {
  id: string;
  day: number;
  week: number;
  slot: StoicRehabSlot;
  /** Checklist title, e.g. "Morning Stoic Intention · Separate Control from Noise" */
  title: string;
  /** Short content title within the slot, e.g. "Separate Control from Noise" */
  contentTitle: string;
  dayTheme: string;
  theme: string;
  virtue: StoicClassicalVirtue;
  category: "stoicism";
  theory: string;
  task: string;
  journalPrompt: string;
  durationMinutes: number;
  tags: string[];
  intensity: StoicRehabIntensity;
  suggestedWhen: StoicRehabSuggestedWhen;
};

export type StoicRehabCompletion = {
  id: string;
  userId: string;
  exerciseId: string;
  completedAt: string;
  journalText?: string;
  processScore?: StoicRehabProcessScore;
  adapted?: boolean;
};

export type StoicVirtueScores = Record<StoicRehabVirtue, number>;

export type StoicWeekSummaryJournalEntry = {
  day: number;
  title: string;
  journalText?: string;
  processScore?: StoicRehabProcessScore;
  completedAt: string;
  adapted?: boolean;
};

export type StoicWeekSummary = {
  week: number;
  theme: string;
  daysCompleted: number;
  daysInWeek: number;
  averageProcessScore: number | null;
  virtues: StoicVirtueScores;
  journalEntries: StoicWeekSummaryJournalEntry[];
};
