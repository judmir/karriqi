import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Minus,
} from "lucide-react";

import { todoPriorityLabel } from "@/lib/todo/priority";
import { cn } from "@/lib/utils";
import type { TodoPriority } from "@/types/todo";

function priorityIconClass(priority: TodoPriority): string {
  switch (priority) {
    case "highest":
      return "text-red-500";
    case "high":
      return "text-orange-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-emerald-500";
    case "lowest":
      return "text-sky-500";
    default:
      return "text-muted-foreground";
  }
}

function PriorityGlyph({
  priority,
  className,
}: {
  priority: TodoPriority;
  className?: string;
}) {
  const iconClass = cn("size-4 shrink-0", priorityIconClass(priority), className);
  switch (priority) {
    case "highest":
      return <ChevronsUp className={iconClass} aria-hidden />;
    case "high":
      return <ChevronUp className={iconClass} aria-hidden />;
    case "medium":
      return <Minus className={iconClass} aria-hidden />;
    case "low":
      return <ChevronDown className={iconClass} aria-hidden />;
    case "lowest":
      return <ChevronsDown className={iconClass} aria-hidden />;
    default:
      return <Minus className={iconClass} aria-hidden />;
  }
}

export function PriorityIcon({
  priority,
  className,
  size = "md",
}: {
  priority: TodoPriority;
  className?: string;
  size?: "sm" | "md";
}) {
  const label = todoPriorityLabel(priority);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      title={label}
      aria-label={`Priority: ${label}`}
    >
      <PriorityGlyph
        priority={priority}
        className={size === "sm" ? "size-3.5" : undefined}
      />
    </span>
  );
}

export function PriorityMenuLabel({
  priority,
  selected,
}: {
  priority: TodoPriority;
  selected?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <PriorityIcon priority={priority} size="sm" />
      <span>{todoPriorityLabel(priority)}</span>
      {selected ? (
        <span className="text-muted-foreground ml-auto text-xs">Current</span>
      ) : null}
    </span>
  );
}
