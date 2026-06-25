import { differenceInCalendarDays, startOfDay } from "date-fns";

import { mergeSpeechEventDescription } from "@/lib/rehab/speech-session";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import {
  SPEECH_ARTICULATION_WEEKDAYS,
  SPEECH_BASELINE_A,
  SPEECH_BASELINE_B,
  SPEECH_ROTATING_TEXTS,
} from "@/modules/rehab/neuro-rehab-2026/speech-reading-texts";

export const SPEECH_EVENT_DESCRIPTION_STUB =
  "Speech practice — read one text, record, tap ratings.";

export type SpeechReadingText = {
  title: string;
  hint: string;
  body: string;
};

export type SpeechDayPlan = {
  programDayOffset: number;
  dayOfWeek: number;
  rotatingIndex: number;
  includeArticulation: boolean;
};

export function programDayOffsetForDate(day: Date): number {
  return differenceInCalendarDays(startOfDay(day), startOfDay(PROGRAM_START));
}

export function speechDayPlanForDate(day: Date): SpeechDayPlan {
  const programDayOffset = programDayOffsetForDate(day);
  const dayOfWeek = startOfDay(day).getDay();
  const rotatingIndex =
    ((programDayOffset % SPEECH_ROTATING_TEXTS.length) +
      SPEECH_ROTATING_TEXTS.length) %
    SPEECH_ROTATING_TEXTS.length;

  return {
    programDayOffset,
    dayOfWeek,
    rotatingIndex,
    includeArticulation: (
      SPEECH_ARTICULATION_WEEKDAYS as readonly number[]
    ).includes(dayOfWeek),
  };
}

/** One reading text per day — best fit for that program day. */
export function speechReadingTextForDate(day: Date): SpeechReadingText {
  const plan = speechDayPlanForDate(day);
  const rotating = SPEECH_ROTATING_TEXTS[plan.rotatingIndex];

  if (plan.includeArticulation) {
    return SPEECH_BASELINE_B;
  }

  if (plan.programDayOffset % 7 === 0) {
    return SPEECH_BASELINE_A;
  }

  return {
    title: rotating.theme,
    hint: "Lexo ngadalë por natyrshëm, jo të tepruar.",
    body: rotating.body,
  };
}

/** Stored on new/generated speech events; UI text comes from the date. */
export function buildSpeechDescriptionForDate(_day: Date): string {
  return SPEECH_EVENT_DESCRIPTION_STUB;
}

export function mergeSpeechDescriptionForSync(
  template: string | null | undefined,
  existing: string | null | undefined,
): string | null {
  return mergeSpeechEventDescription(template, existing);
}
