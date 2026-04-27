import type { TodoStatus } from "@/types/todo";

export function todoStatusLabel(status: TodoStatus): string {
  switch (status) {
    case "backlog":
      return "Backlog";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    default:
      return status;
  }
}

/** Compact label for cards (reference-style: Queue / In progress / Completed). */
export function todoStatusCardLabel(status: TodoStatus): string {
  switch (status) {
    case "backlog":
      return "Queue";
    case "in_progress":
      return "In progress";
    case "done":
      return "Completed";
    default:
      return status;
  }
}

export function todoStatusAccentClass(status: TodoStatus): string {
  switch (status) {
    case "done":
      return "bg-emerald-400";
    case "in_progress":
      return "bg-sky-400";
    case "backlog":
      return "bg-muted-foreground/60";
    default:
      return "bg-muted-foreground";
  }
}
