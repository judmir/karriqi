export type JournalRatingKey =
  | "sleep"
  | "stress"
  | "fatigue"
  | "leftHand"
  | "leftLeg"
  | "speech"
  | "saliva"
  | "stairs"
  | "typing";

export const JOURNAL_RATING_FIELDS: { key: JournalRatingKey; label: string }[] = [
  { key: "sleep", label: "Sleep quality" },
  { key: "stress", label: "Stress" },
  { key: "fatigue", label: "Fatigue" },
  { key: "leftHand", label: "Left hand difficulty" },
  { key: "leftLeg", label: "Left leg heaviness/coordination" },
  { key: "speech", label: "Speech difficulty" },
  { key: "saliva", label: "Saliva/swallow difficulty" },
  { key: "stairs", label: "Stairs difficulty" },
  { key: "typing", label: "Typing difficulty" },
];

export const REHAB_DONE_VALUES = ["yes", "partial", "no"] as const;
export type RehabDoneValue = (typeof REHAB_DONE_VALUES)[number];

/** Shown under Notes in the journal modal (not stored in the textarea). */
export const JOURNAL_NOTES_HELPER =
  "Rate sleep, stress, fatigue, hand, leg, speech.";

/** Legacy program-event description; treat as empty when loading notes. */
export const JOURNAL_PROGRAM_EVENT_HINT =
  "Rate sleep, stress, fatigue, hand, leg, speech. See Rehab → Journal.";

export type JournalRatings = Partial<Record<JournalRatingKey, number>>;

export type JournalEntryData = {
  ratings: JournalRatings;
  rehabDone: RehabDoneValue | null;
  notes: string;
};

const JOURNAL_MARKER = /<!-- karriqi-journal:([\s\S]+?) -->/;

const RATING_KEYS = new Set<JournalRatingKey>(
  JOURNAL_RATING_FIELDS.map((field) => field.key),
);

function isRatingKey(value: string): value is JournalRatingKey {
  return RATING_KEYS.has(value as JournalRatingKey);
}

function isRehabDone(value: unknown): value is RehabDoneValue {
  return (
    typeof value === "string" &&
    (REHAB_DONE_VALUES as readonly string[]).includes(value)
  );
}

export function emptyJournalEntry(): JournalEntryData {
  return { ratings: {}, rehabDone: null, notes: "" };
}

export function normalizeJournalNotes(notes: string): string {
  const trimmed = notes.trim();
  if (
    trimmed === JOURNAL_PROGRAM_EVENT_HINT ||
    trimmed === JOURNAL_NOTES_HELPER
  ) {
    return "";
  }
  return notes;
}

export function parseJournalDescription(
  raw: string | null | undefined,
): JournalEntryData {
  if (!raw) {
    return emptyJournalEntry();
  }

  const match = raw.match(JOURNAL_MARKER);
  if (!match || match.index === undefined) {
    return { ratings: {}, rehabDone: null, notes: raw.trim() };
  }

  const notes = raw.slice(0, match.index).trimEnd();

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return { ratings: {}, rehabDone: null, notes };
    }

    const record = parsed as {
      ratings?: Record<string, unknown>;
      rehabDone?: unknown;
    };

    const ratings: JournalRatings = {};
    if (record.ratings && typeof record.ratings === "object") {
      for (const [key, value] of Object.entries(record.ratings)) {
        if (
          isRatingKey(key) &&
          typeof value === "number" &&
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 10
        ) {
          ratings[key] = Math.round(value);
        }
      }
    }

    const rehabDone = isRehabDone(record.rehabDone) ? record.rehabDone : null;

    return { ratings, rehabDone, notes };
  } catch {
    return { ratings: {}, rehabDone: null, notes };
  }
}

export function serializeJournalDescription(
  data: JournalEntryData,
): string | null {
  const notes = data.notes.trim();

  const ratings: JournalRatings = {};
  for (const { key } of JOURNAL_RATING_FIELDS) {
    const value = data.ratings[key];
    if (typeof value === "number" && value >= 0 && value <= 10) {
      ratings[key] = value;
    }
  }

  const hasRatings = Object.keys(ratings).length > 0;
  const hasMeta = hasRatings || data.rehabDone !== null;

  if (!hasMeta) {
    return notes || null;
  }

  const payload = JSON.stringify({
    ratings,
    rehabDone: data.rehabDone,
  });
  const marker = `<!-- karriqi-journal:${payload} -->`;

  return notes ? `${notes}\n\n${marker}` : marker;
}
