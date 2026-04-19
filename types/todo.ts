/** ISO 8601 timestamp string (e.g. from DB or `toISOString()`). */
export type IsoDateString = string;

export type TodoStatus = "backlog" | "in_progress" | "done";

export const TODO_STATUSES: readonly TodoStatus[] = [
  "backlog",
  "in_progress",
  "done",
] as const;

export type TodoComment = {
  id: string;
  todoItemId: string;
  userId: string;
  body: string;
  createdAt: IsoDateString;
};

export type TodoSubtask = {
  id: string;
  todoItemId: string;
  label: string;
  done: boolean;
  position: number;
};

export type TodoItem = {
  id: string;
  userId: string;
  title: string;
  /** Short label shown under the title (e.g. “Taxes”, “Home”). */
  category: string | null;
  description: string | null;
  status: TodoStatus;
  position: number;
  /** Order in the single main list (lower = higher on the page). */
  listOrder: number;
  dueAt: string | null;
  progressPercent: number | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  comments: TodoComment[];
  subtasks: TodoSubtask[];
};
