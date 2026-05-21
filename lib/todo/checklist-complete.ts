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
