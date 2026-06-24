import { addDays, addMinutes } from "date-fns";

import { appendStoicExerciseIdMarker } from "@/lib/rehab/stoic-path-event-metadata";
import { stoicSlotScheduleTime } from "@/lib/rehab/stoic-rehab-utils";
import {
  NEURO_REHAB_PROGRAM_ID,
  PROGRAM_START,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import { STOIC_REHAB_EXERCISES } from "@/modules/rehab/neuro-rehab-2026/stoic-rehab-exercises";
import type { StoicRehabExercise } from "@/types/stoic-rehab";
import type { RehabPlanEventInsert } from "@/types/rehab";

function buildStoicPathEventDescription(exercise: StoicRehabExercise): string {
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

/** One concrete timed row per Stoic Path exercise (84 days × 3 slots). */
export function generateStoicPathProgramEvents(
  userId: string,
): RehabPlanEventInsert[] {
  const events: RehabPlanEventInsert[] = [];

  for (const exercise of STOIC_REHAB_EXERCISES) {
    const day = addDays(PROGRAM_START, exercise.day - 1);
    const start = stoicSlotScheduleTime(day, exercise.slot);
    const end = addMinutes(start, exercise.durationMinutes);

    events.push({
      id: crypto.randomUUID(),
      user_id: userId,
      title: exercise.title,
      description: buildStoicPathEventDescription(exercise),
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      all_day: false,
      color: "purple",
      event_kind: "stoic",
      program_id: NEURO_REHAB_PROGRAM_ID,
      plan_week: exercise.week,
    });
  }

  return events;
}
