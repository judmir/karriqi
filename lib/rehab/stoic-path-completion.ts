import type { RehabPlanEvent } from "@/types/rehab";

import {
  getStoicPathExerciseId,
  isPersistedStoicPathPlanEvent,
  isStoicPathPlanEvent,
} from "@/lib/rehab/stoic-rehab-utils";
import type { StoicRehabStore } from "@/stores/stoic-rehab-store";
import type { RehabPlanStore } from "@/stores/rehab-plan-store";

type StoicCompletionStore = Pick<
  StoicRehabStore,
  "saveCompletion" | "clearCompletion"
>;

type RehabCompletionStore = Pick<
  RehabPlanStore,
  "toggleOccurrenceCompleted"
>;

/** Persist Stoic Path completion to both rehab_stoic_completions and plan events. */
export async function setStoicPathExerciseCompleted(
  event: RehabPlanEvent,
  completed: boolean,
  stoicStore: StoicCompletionStore,
  rehabStore: RehabCompletionStore,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isStoicPathPlanEvent(event)) {
    return { ok: false, message: "Not a Stoic Path event." };
  }

  const exerciseId = getStoicPathExerciseId(event);
  if (!exerciseId) {
    return { ok: false, message: "Missing Stoic exercise id." };
  }

  if (completed) {
    const stoicResult = await stoicStore.saveCompletion({ exerciseId });
    if (!stoicResult.ok) {
      return stoicResult;
    }
  } else {
    const stoicResult = await stoicStore.clearCompletion(exerciseId);
    if (!stoicResult.ok) {
      return stoicResult;
    }
  }

  if (isPersistedStoicPathPlanEvent(event)) {
    return rehabStore.toggleOccurrenceCompleted(event, completed);
  }

  return { ok: true };
}
