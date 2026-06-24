/** Machine-readable exercise id embedded in persisted Stoic Path plan rows. */
const STOIC_EXERCISE_ID_MARKER =
  /<!-- karriqi-stoic-exercise-id:([a-z0-9-]+) -->/;

export function stoicExerciseIdMarker(exerciseId: string): string {
  return `<!-- karriqi-stoic-exercise-id:${exerciseId} -->`;
}

export function parseStoicExerciseIdFromDescription(
  description: string | null | undefined,
): string | null {
  if (!description) {
    return null;
  }
  const match = description.match(STOIC_EXERCISE_ID_MARKER);
  return match?.[1] ?? null;
}

export function appendStoicExerciseIdMarker(
  description: string,
  exerciseId: string,
): string {
  if (parseStoicExerciseIdFromDescription(description)) {
    return description;
  }
  return `${description.trimEnd()}\n\n${stoicExerciseIdMarker(exerciseId)}`;
}
