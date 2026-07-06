import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  format,
  isBefore,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from "date-fns";

import {
  appendStoicExerciseIdMarker,
  parseStoicExerciseIdFromDescription,
} from "@/lib/rehab/stoic-path-event-metadata";

import {
  NEURO_REHAB_PROGRAM_ID,
  PROGRAM_START,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import {
  STOIC_REHAB_EXERCISES,
  STOIC_REHAB_EXERCISES_PER_DAY,
  STOIC_REHAB_PROGRAM_DAYS,
  STOIC_REHAB_WEEK_THEMES,
} from "@/modules/rehab/neuro-rehab-2026/stoic-rehab-exercises";
import { STOIC_INTENTION_TITLE } from "@/modules/rehab/neuro-rehab-2026/stoic-content";
import type {
  StoicRehabCompletion,
  StoicRehabExercise,
  StoicRehabProcessScore,
  StoicRehabSlot,
  StoicRehabSuggestedWhen,
  StoicRehabVirtue,
  StoicVirtueScores,
  StoicWeekSummary,
} from "@/types/stoic-rehab";
import type { RehabPlanEvent } from "@/types/rehab";

export const STOIC_PATH_PLAN_EVENT_ID_PREFIX = "stoic-path:";

/** Stoic activities appear in the daily checklist — not a separate section. */
export const STOIC_PATH_PLAN_KIND_LABEL = "Stoicism";

export const STOIC_REHAB_CATEGORY = "stoicism";

export const STOIC_REHAB_DAY_MIN = 1;
export const STOIC_REHAB_DAY_MAX = STOIC_REHAB_PROGRAM_DAYS;

const EXERCISES_BY_DAY = new Map<number, StoicRehabExercise[]>();

for (const exercise of STOIC_REHAB_EXERCISES) {
  const list = EXERCISES_BY_DAY.get(exercise.day) ?? [];
  list.push(exercise);
  EXERCISES_BY_DAY.set(exercise.day, list);
}

const EXERCISE_BY_ID = new Map<string, StoicRehabExercise>(
  STOIC_REHAB_EXERCISES.map((exercise) => [exercise.id, exercise]),
);

const VIRTUE_TAGS: StoicRehabVirtue[] = [
  "courage",
  "patience",
  "attention",
  "consistency",
];

export const STOIC_REHAB_SLOT_LABELS: Record<StoicRehabSlot, string> = {
  morning: "Morning Stoic Intention",
  midday: "Midday Stoic Challenge",
  evening: "Evening Stoic Review",
};

/** Program day index (1–84) from rehab start date and a calendar date. */
export function getStoicProgramDayIndex(
  startDate: Date,
  currentDate: Date = new Date(),
): number {
  const start = startOfDay(startDate);
  const current = startOfDay(currentDate);
  const offset = differenceInCalendarDays(current, start) + 1;
  return clampStoicDay(offset);
}

export function clampStoicDay(day: number): number {
  if (day < STOIC_REHAB_DAY_MIN) {
    return STOIC_REHAB_DAY_MIN;
  }
  if (day > STOIC_REHAB_DAY_MAX) {
    return STOIC_REHAB_DAY_MAX;
  }
  return day;
}

export function getStoicExercisesForDay(day: number): StoicRehabExercise[] {
  const clamped = clampStoicDay(day);
  const exercises = EXERCISES_BY_DAY.get(clamped);
  if (!exercises || exercises.length === 0) {
    throw new Error(`Missing Stoic rehab exercises for day ${clamped}.`);
  }
  return exercises;
}

/** Primary midday exercise for a program day (backward-compatible single lookup). */
export function getStoicExerciseByDay(
  day: number,
  slot: StoicRehabSlot = "midday",
): StoicRehabExercise {
  const exercise = getStoicExercisesForDay(day).find((item) => item.slot === slot);
  if (!exercise) {
    throw new Error(`Missing Stoic rehab exercise for day ${day} (${slot}).`);
  }
  return exercise;
}

export function getStoicExerciseById(
  exerciseId: string,
): StoicRehabExercise | null {
  return EXERCISE_BY_ID.get(exerciseId) ?? null;
}

export function getStoicExercisesForDate(
  startDate: Date,
  currentDate: Date = new Date(),
): StoicRehabExercise[] {
  return getStoicExercisesForDay(
    getStoicProgramDayIndex(startDate, currentDate),
  );
}

/** Primary midday exercise for a calendar date. */
export function getStoicExerciseForDate(
  startDate: Date,
  currentDate: Date = new Date(),
  slot: StoicRehabSlot = "midday",
): StoicRehabExercise {
  return getStoicExerciseByDay(
    getStoicProgramDayIndex(startDate, currentDate),
    slot,
  );
}

export function getStoicWeekForDay(day: number): number {
  return Math.ceil(clampStoicDay(day) / 7);
}

export function getStoicWeekTheme(week: number): string {
  return STOIC_REHAB_WEEK_THEMES[week] ?? `Week ${week}`;
}

export function daysInStoicWeek(week: number): number {
  if (week < 1 || week > 12) {
    return 0;
  }
  if (week === 12) {
    return 7;
  }
  return 7;
}

function emptyVirtueScores(): StoicVirtueScores {
  return {
    courage: 0,
    patience: 0,
    attention: 0,
    consistency: 0,
  };
}

function virtueFromTags(tags: string[]): StoicRehabVirtue[] {
  return VIRTUE_TAGS.filter((virtue) => tags.includes(virtue));
}

function averageRounded(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function normalizeProcessScore(
  value: number | null | undefined,
): StoicRehabProcessScore | undefined {
  if (value == null) {
    return undefined;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 3) {
    return 3;
  }
  return Math.round(value) as StoicRehabProcessScore;
}

function completedSlotsForDay(
  day: number,
  completions: StoicRehabCompletion[],
): number {
  const exerciseIds = new Set(
    getStoicExercisesForDay(day).map((exercise) => exercise.id),
  );
  return completions.filter((completion) =>
    exerciseIds.has(completion.exerciseId),
  ).length;
}

export function getStoicWeekSummary(
  week: number,
  completions: StoicRehabCompletion[],
): StoicWeekSummary {
  const weekStartDay = (week - 1) * 7 + 1;
  const weekEndDay = Math.min(week * 7, STOIC_REHAB_DAY_MAX);
  const weekCompletions = completions.filter((completion) => {
    const exercise = getStoicExerciseById(completion.exerciseId);
    return exercise != null && exercise.week === week;
  });

  const virtueBuckets: Record<StoicRehabVirtue, number[]> = {
    courage: [],
    patience: [],
    attention: [],
    consistency: [],
  };

  const processScores: number[] = [];
  const journalEntries: StoicWeekSummary["journalEntries"] = [];

  for (const completion of weekCompletions) {
    const exercise = getStoicExerciseById(completion.exerciseId);
    if (!exercise) {
      continue;
    }

    const score = normalizeProcessScore(completion.processScore);
    if (score != null) {
      processScores.push(score);
      for (const virtue of virtueFromTags(exercise.tags)) {
        virtueBuckets[virtue].push(score);
      }
    }

    journalEntries.push({
      day: exercise.day,
      title: exercise.title,
      journalText: completion.journalText,
      processScore: score,
      completedAt: completion.completedAt,
      adapted: completion.adapted,
    });
  }

  journalEntries.sort((a, b) => a.day - b.day);

  const virtues = emptyVirtueScores();
  for (const virtue of VIRTUE_TAGS) {
    virtues[virtue] = averageRounded(virtueBuckets[virtue]);
  }

  const daysInWeek = weekEndDay - weekStartDay + 1;
  let daysCompleted = 0;
  for (let day = weekStartDay; day <= weekEndDay; day += 1) {
    if (completedSlotsForDay(day, weekCompletions) >= STOIC_REHAB_EXERCISES_PER_DAY) {
      daysCompleted += 1;
    }
  }

  return {
    week,
    theme: getStoicWeekTheme(week),
    daysCompleted,
    daysInWeek,
    averageProcessScore:
      processScores.length > 0 ? averageRounded(processScores) : null,
    virtues,
    journalEntries,
  };
}

export function countCalmDayStreak(
  completions: StoicRehabCompletion[],
  exercisesById: Map<string, StoicRehabExercise> = EXERCISE_BY_ID,
): number {
  const completedByDay = new Map<number, number>();

  for (const completion of completions) {
    const exercise = exercisesById.get(completion.exerciseId);
    if (!exercise) {
      continue;
    }
    completedByDay.set(
      exercise.day,
      (completedByDay.get(exercise.day) ?? 0) + 1,
    );
  }

  let streak = 0;
  for (let day = STOIC_REHAB_DAY_MAX; day >= STOIC_REHAB_DAY_MIN; day -= 1) {
    if ((completedByDay.get(day) ?? 0) >= STOIC_REHAB_EXERCISES_PER_DAY) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export const STOIC_SUGGESTED_WHEN_LABELS = {
  morning: "Morning",
  before_rehab: "Before rehab",
  during_life: "During life",
  evening: "Evening",
} as const;

export const STOIC_PROCESS_SCORE_LABELS: Record<StoicRehabProcessScore, string> =
  {
    0: "Showed up",
    1: "Calm start",
    2: "Useful focus",
    3: "Calm rep completed",
  };

export function isSyntheticStoicPathPlanEvent(
  event: Pick<RehabPlanEvent, "id">,
): boolean {
  return event.id.startsWith(STOIC_PATH_PLAN_EVENT_ID_PREFIX);
}

export function isStoicPathPlanEvent(
  event: Pick<
    RehabPlanEvent,
    "id" | "eventKind" | "description" | "recurrence"
  >,
): boolean {
  if (isSyntheticStoicPathPlanEvent(event)) {
    return true;
  }
  if (event.eventKind !== "stoic" || event.recurrence) {
    return false;
  }
  return parseStoicExerciseIdFromDescription(event.description) != null;
}

export function isPersistedStoicPathPlanEvent(
  event: Pick<
    RehabPlanEvent,
    "id" | "eventKind" | "description" | "recurrence"
  >,
): boolean {
  return isStoicPathPlanEvent(event) && !isSyntheticStoicPathPlanEvent(event);
}

export function stoicPathPlanEventId(exerciseId: string): string {
  return `${STOIC_PATH_PLAN_EVENT_ID_PREFIX}${exerciseId}`;
}

export function parseStoicPathExerciseId(planEventId: string): string {
  return planEventId.slice(STOIC_PATH_PLAN_EVENT_ID_PREFIX.length);
}

export function getStoicPathExerciseId(
  event: Pick<RehabPlanEvent, "id" | "description">,
): string | null {
  if (isSyntheticStoicPathPlanEvent(event)) {
    return parseStoicPathExerciseId(event.id);
  }
  return parseStoicExerciseIdFromDescription(event.description);
}

/** Legacy recurring "Stoic intention" rows replaced by the 84-day Stoic Path task. */
export function isLegacyStoicIntentionEvent(
  event: Pick<RehabPlanEvent, "eventKind" | "title">,
): boolean {
  return event.eventKind === "stoic" && event.title === STOIC_INTENTION_TITLE;
}

export function stoicSlotScheduleTime(day: Date, slot: StoicRehabSlot): Date {
  const schedule: Record<StoicRehabSlot, [number, number]> = {
    morning: [7, 0],
    midday: [12, 30],
    evening: [19, 30],
  };
  const [hour, minute] = schedule[slot];
  return setSeconds(setMinutes(setHours(startOfDay(day), hour), minute), 0);
}

function buildStoicEventDescription(exercise: StoicRehabExercise): string {
  const lines = [
    `Theme: ${exercise.dayTheme}`,
    `Virtue: ${exercise.virtue}`,
    `Duration: ~${exercise.durationMinutes} min`,
    "",
    "**Why this matters**",
    exercise.theory,
    "",
    "**Train the response**",
    exercise.task,
  ];
  if (exercise.journalPrompt) {
    lines.push("", `**Journal:** ${exercise.journalPrompt}`);
  }
  return appendStoicExerciseIdMarker(lines.join("\n"), exercise.id);
}

/** Synthetic daily checklist row backed by stoic-rehab completion storage. */
export function buildStoicRehabPlanEvent(
  day: Date,
  exercise: StoicRehabExercise,
  completion: StoicRehabCompletion | null,
): RehabPlanEvent {
  const startAt = stoicSlotScheduleTime(day, exercise.slot);
  const endAt = addMinutes(startAt, exercise.durationMinutes);
  const timestamp = startAt.toISOString();

  return {
    id: stoicPathPlanEventId(exercise.id),
    userId: "",
    title: exercise.title,
    description: buildStoicEventDescription(exercise),
    startAt: timestamp,
    endAt: endAt.toISOString(),
    allDay: false,
    color: "purple",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: completion?.completedAt ?? null,
    eventKind: "stoic",
    programId: NEURO_REHAB_PROGRAM_ID,
    planWeek: exercise.week,
    speechRecordings: [],
    seriesId: null,
    recurrence: null,
    recurrenceAt: null,
    recurrenceCancelled: false,
  };
}

/** @deprecated Alias for buildStoicRehabPlanEvent */
export const buildStoicPathPlanEvent = buildStoicRehabPlanEvent;

export function addStoicEventsToRehabDay(
  events: RehabPlanEvent[],
  day: Date,
  completions: StoicRehabCompletion[],
): RehabPlanEvent[] {
  return mergeStoicPathIntoTodayEvents(events, day, completions);
}

export function mergeStoicPathIntoTodayEvents(
  events: RehabPlanEvent[],
  day: Date,
  completions: StoicRehabCompletion[],
): RehabPlanEvent[] {
  return injectStoicPathEventsForRange(
    events,
    startOfDay(day),
    startOfDay(day),
    completions,
  );
}

/** Inject Stoic Path tasks only when persisted rows are missing (offline fallback). */
export function injectStoicPathEventsForRange(
  events: RehabPlanEvent[],
  windowStart: Date,
  windowEnd: Date,
  completions: StoicRehabCompletion[],
): RehabPlanEvent[] {
  const withoutLegacy = events.filter(
    (event) => !isLegacyStoicIntentionEvent(event),
  );
  const persistedPath = withoutLegacy.filter(isPersistedStoicPathPlanEvent);
  const nonPath = withoutLegacy.filter((event) => !isStoicPathPlanEvent(event));

  const persistedDays = new Set(
    persistedPath
      .filter((event) => {
        const day = startOfDay(new Date(event.startAt));
        return day >= startOfDay(windowStart) && day <= startOfDay(windowEnd);
      })
      .map((event) => format(startOfDay(new Date(event.startAt)), "yyyy-MM-dd")),
  );

  const completionByExerciseId = new Map(
    completions.map((completion) => [completion.exerciseId, completion]),
  );

  const injected: RehabPlanEvent[] = [];
  const programStart = startOfDay(PROGRAM_START);
  let day = startOfDay(windowStart);
  const end = startOfDay(windowEnd);

  while (day.getTime() <= end.getTime()) {
    const dayKey = format(day, "yyyy-MM-dd");
    if (
      !isBefore(day, programStart) &&
      !persistedDays.has(dayKey)
    ) {
      const exercises = getStoicExercisesForDate(PROGRAM_START, day);
      for (const exercise of exercises) {
        injected.push(
          buildStoicRehabPlanEvent(
            day,
            exercise,
            completionByExerciseId.get(exercise.id) ?? null,
          ),
        );
      }
    }
    day = addDays(day, 1);
  }

  return [...nonPath, ...persistedPath, ...injected];
}

export function summarizeStoicPathCompletion(
  completion: StoicRehabCompletion | null | undefined,
): string {
  if (!completion) {
    return "";
  }
  const parts: string[] = [];
  if (completion.processScore != null) {
    parts.push(
      `Process ${completion.processScore} · ${STOIC_PROCESS_SCORE_LABELS[completion.processScore]}`,
    );
  }
  const note = completion.journalText?.trim();
  if (note) {
    parts.push(note);
  }
  if (completion.adapted) {
    parts.push("Adapted today");
  }
  return parts.join(" · ");
}
