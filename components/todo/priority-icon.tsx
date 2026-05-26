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

function priorityBadgeClass(priority: TodoPriority): string {
  switch (priority) {
    case "highest":
      return "border-red-500/25 bg-red-500/10 text-red-300";
    case "high":
      return "border-orange-500/25 bg-orange-500/10 text-orange-300";
    case "medium":
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    case "low":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    case "lowest":
      return "border-sky-500/25 bg-sky-500/10 text-sky-300";
    default:
      return "border-border/70 bg-muted text-muted-foreground";
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

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TodoPriority;
  className?: string;
}) {
  const label = todoPriorityLabel(priority);
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        priorityBadgeClass(priority),
        className,
      )}
      title={`Priority: ${label}`}
      aria-label={`Priority: ${label}`}
    >
      <PriorityGlyph priority={priority} className="size-3.5" />
      <span>{label}</span>
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
