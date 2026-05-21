import type { TodoItem, TodoPriority } from "@/types/todo";
import { TODO_PRIORITIES } from "@/types/todo";

/** Lower rank = higher urgency (shown first on the board). */
const PRIORITY_RANK: Record<TodoPriority, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};

export function isTodoPriority(value: string): value is TodoPriority {
  return (TODO_PRIORITIES as readonly string[]).includes(value);
}

export function normalizeTodoPriority(
  value: string | null | undefined,
): TodoPriority {
  if (value && isTodoPriority(value)) return value;
  return "medium";
}

export function todoPriorityRank(priority: TodoPriority): number {
  return PRIORITY_RANK[priority];
}

export function todoPriorityLabel(priority: TodoPriority): string {
  switch (priority) {
    case "highest":
      return "Highest";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    case "lowest":
      return "Lowest";
    default:
      return priority;
  }
}

export function compareTodoItemsByPriorityAndPosition(
  a: Pick<TodoItem, "priority" | "position" | "listOrder">,
  b: Pick<TodoItem, "priority" | "position" | "listOrder">,
): number {
  const pr =
    todoPriorityRank(a.priority) - todoPriorityRank(b.priority);
  if (pr !== 0) return pr;
  if (a.position !== b.position) return a.position - b.position;
  return a.listOrder - b.listOrder;
}
