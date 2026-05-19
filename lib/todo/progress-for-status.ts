import type { TodoStatus } from "@/types/todo";

/** Default task progress for each kanban column. */
export function progressPercentForStatus(status: TodoStatus): number {
  switch (status) {
    case "backlog":
      return 0;
    case "in_progress":
      return 20;
    case "done":
      return 100;
    default:
      return 0;
  }
}
