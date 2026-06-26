import {
  isSpontaneousOptionId,
  type SpontaneousPromptKey,
} from "@/modules/rehab/neuro-rehab-2026/speech-reading-texts";

export type SpeechRatingKey =
  | "clarity"
  | "effort"
  | "speedControl"
  | "fatigue"
  | "saliva";

export const SPEECH_RATING_FIELDS: {
  key: SpeechRatingKey;
  label: string;
}[] = [
  { key: "clarity", label: "Clarity" },
  { key: "effort", label: "Effort" },
  { key: "speedControl", label: "Speed control" },
  { key: "fatigue", label: "Fatigue" },
  { key: "saliva", label: "Saliva/swallow" },
];

export const SPEECH_HARD_SOUND_OPTIONS = [
  "rr",
  "r",
  "ll",
  "l",
  "th",
  "dh",
  "gj",
  "q",
  "ç",
  "xh",
  "sh",
  "zh",
] as const;

export type SpeechHardSound = (typeof SPEECH_HARD_SOUND_OPTIONS)[number];

export type SpontaneousSelections = Partial<
  Record<SpontaneousPromptKey, string[]>
>;

export type SpeechSessionData = {
  ratings: Partial<Record<SpeechRatingKey, number>>;
  /** @deprecated Legacy flag — use spontaneous selections instead. */
  spontaneousDone: boolean;
  spontaneousDoneAt: string | null;
  spontaneous: SpontaneousSelections;
  hardSounds: SpeechHardSound[];
};

const SPEECH_SESSION_MARKER = /<!-- karriqi-speech-session:([\s\S]+?) -->/;

const RATING_KEYS = new Set<SpeechRatingKey>(
  SPEECH_RATING_FIELDS.map((field) => field.key),
);

const HARD_SOUND_SET = new Set<string>(SPEECH_HARD_SOUND_OPTIONS);

function isRatingKey(value: string): value is SpeechRatingKey {
  return RATING_KEYS.has(value as SpeechRatingKey);
}

function isHardSound(value: string): value is SpeechHardSound {
  return HARD_SOUND_SET.has(value);
}

const PROMPT_KEYS = new Set<SpontaneousPromptKey>([
  "speechFelt",
  "bodyFelt",
  "tomorrowNotice",
]);

function isPromptKey(value: string): value is SpontaneousPromptKey {
  return PROMPT_KEYS.has(value as SpontaneousPromptKey);
}

function parseSpontaneousOptionIds(value: unknown): string[] {
  if (typeof value === "string" && isSpontaneousOptionId(value)) {
    return [value];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const ids: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && isSpontaneousOptionId(item)) {
      if (!ids.includes(item)) {
        ids.push(item);
      }
    }
  }

  return ids;
}

function parseSpontaneousSelections(
  record: Record<string, unknown>,
): SpontaneousSelections {
  const spontaneous: SpontaneousSelections = {};
  const raw =
    record.spontaneous && typeof record.spontaneous === "object"
      ? (record.spontaneous as Record<string, unknown>)
      : null;

  if (raw) {
    for (const [key, value] of Object.entries(raw)) {
      if (!isPromptKey(key)) {
        continue;
      }

      const optionIds = parseSpontaneousOptionIds(value);
      if (optionIds.length > 0) {
        spontaneous[key] = optionIds;
      }
    }
  }

  return spontaneous;
}

export function emptySpeechSession(): SpeechSessionData {
  return {
    ratings: {},
    spontaneousDone: false,
    spontaneousDoneAt: null,
    spontaneous: {},
    hardSounds: [],
  };
}

export function parseSpeechSession(
  raw: string | null | undefined,
): SpeechSessionData {
  if (!raw) {
    return emptySpeechSession();
  }

  const match = raw.match(SPEECH_SESSION_MARKER);
  if (!match) {
    return emptySpeechSession();
  }

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return emptySpeechSession();
    }

    const record = parsed as {
      ratings?: Record<string, unknown>;
      spontaneousDone?: unknown;
      spontaneousDoneAt?: unknown;
      spontaneous?: unknown;
      hardSounds?: unknown;
    };

    const spontaneous = parseSpontaneousSelections(record);

    const ratings: Partial<Record<SpeechRatingKey, number>> = {};
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

    const hardSounds: SpeechHardSound[] = [];
    if (Array.isArray(record.hardSounds)) {
      for (const value of record.hardSounds) {
        if (typeof value === "string" && isHardSound(value)) {
          hardSounds.push(value);
        }
      }
    }

    return {
      ratings,
      spontaneousDone:
        record.spontaneousDone === true || Object.keys(spontaneous).length > 0,
      spontaneousDoneAt:
        typeof record.spontaneousDoneAt === "string"
          ? record.spontaneousDoneAt
          : null,
      spontaneous,
      hardSounds,
    };
  } catch {
    return emptySpeechSession();
  }
}

function sessionHasData(session: SpeechSessionData): boolean {
  return (
    session.spontaneousDone ||
    Object.keys(session.spontaneous).length > 0 ||
    Object.keys(session.ratings).length > 0 ||
    session.hardSounds.length > 0
  );
}

export function serializeSpeechSession(
  session: SpeechSessionData,
): string | null {
  if (!sessionHasData(session)) {
    return null;
  }

  const ratings: Partial<Record<SpeechRatingKey, number>> = {};
  for (const { key } of SPEECH_RATING_FIELDS) {
    const value = session.ratings[key];
    if (typeof value === "number" && value >= 0 && value <= 10) {
      ratings[key] = value;
    }
  }

  const payload = JSON.stringify({
    ratings,
    spontaneous: session.spontaneous,
    spontaneousDoneAt: session.spontaneousDoneAt,
    hardSounds: session.hardSounds,
  });

  return `<!-- karriqi-speech-session:${payload} -->`;
}

/** Keep saved session clicks when syncing template descriptions. */
export function mergeSpeechEventDescription(
  template: string | null | undefined,
  existing: string | null | undefined,
): string | null {
  const session = parseSpeechSession(existing);
  return serializeSpeechSession(session) ?? template ?? null;
}
