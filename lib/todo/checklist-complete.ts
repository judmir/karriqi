import type { TodoSubtask } from "@/types/todo";

export const CHECKLIST_INCOMPLETE_MESSAGE =
  "Complete all checklist items before moving this task to Done.";

/** True when there are no checklist steps, or every step is marked done. */
export function isTodoChecklistComplete(
  subtasks: readonly Pick<TodoSubtask, "done">[],
): boolean {
  if (subtasks.length === 0) return true;
  return subtasks.every((s) => s.done);
}

/** Board summary variant using pre-aggregated subtask counts. */
export function isTodoBoardChecklistComplete(item: {
  subtaskCount: number;
  subtaskDoneCount: number;
}): boolean {
  if (item.subtaskCount === 0) return true;
  return item.subtaskDoneCount === item.subtaskCount;
}
