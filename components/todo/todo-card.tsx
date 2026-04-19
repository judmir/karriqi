"use client";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  MoreHorizontal,
  Paperclip,
  Undo2,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { todoStatusCardLabel } from "@/lib/todo/status-label";
import { cn } from "@/lib/utils";
import type { TodoItem, TodoStatus } from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

function initialsFromEmail(email: string) {
  const safe = email.trim();
  if (safe.includes("@")) {
    const local = safe.split("@")[0] ?? "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return local.toUpperCase() || "?";
  }
  return safe.length >= 2 ? safe.slice(0, 2).toUpperCase() : safe.toUpperCase() || "?";
}

function formatDueBadge(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function adjacentStatuses(status: TodoStatus): {
  prev: TodoStatus | null;
  next: TodoStatus | null;
} {
  const i = TODO_STATUSES.indexOf(status);
  if (i < 0) {
    return { prev: null, next: null };
  }
  return {
    prev: i > 0 ? TODO_STATUSES[i - 1]! : null,
    next: i < TODO_STATUSES.length - 1 ? TODO_STATUSES[i + 1]! : null,
  };
}

function StatusPillIcon({ status }: { status: TodoStatus }) {
  const cls = "size-3.5 shrink-0 stroke-[2.5]";
  if (status === "done") {
    return (
      <span
        className="border-emerald-500 bg-emerald-500/15 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border"
        aria-hidden
      />
    );
  }
  if (status === "in_progress") {
    return <Circle className={cn(cls, "text-sky-400")} aria-hidden />;
  }
  return <Circle className={cn(cls, "text-muted-foreground")} aria-hidden />;
}

export function TodoCard({
  item,
  listIndex,
  listLength,
  persistence,
  ownerEmail,
  onOpen,
  onStatusChange,
  onMoveInList,
}: {
  item: TodoItem;
  listIndex: number;
  listLength: number;
  persistence: boolean;
  ownerEmail: string;
  onOpen: () => void;
  onStatusChange: (status: TodoStatus) => void;
  onMoveInList: (direction: -1 | 1) => void;
}) {
  const initials = initialsFromEmail(ownerEmail);
  const dueShort = formatDueBadge(item.dueAt);
  const attachmentCount = item.comments.length + item.subtasks.length;
  const { prev: prevStatus, next: nextStatus } = adjacentStatuses(item.status);

  return (
    <div
      className={cn(
        "ring-border/50 bg-card/90 relative overflow-hidden rounded-2xl ring-1",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "backdrop-blur-sm transition-[box-shadow,transform] hover:shadow-lg hover:ring-border/70",
      )}
    >
      {/* Top: assignee + status pill | status step controls */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar
            size="sm"
            className="ring-background shrink-0 ring-2 ring-offset-0"
          >
            <AvatarFallback className="text-[10px] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "border-border text-foreground inline-flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
              "bg-muted/30",
            )}
          >
            <StatusPillIcon status={item.status} />
            <span className="truncate">{todoStatusCardLabel(item.status)}</span>
          </div>
        </div>

        <div className="group flex shrink-0 items-center justify-end gap-0.5">
          {prevStatus ? (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "text-muted-foreground hover:text-foreground",
                "pointer-events-none opacity-0 transition-opacity duration-150",
                "group-hover:pointer-events-auto group-hover:opacity-100",
                "focus-visible:pointer-events-auto focus-visible:opacity-100",
              )}
              disabled={!persistence}
              title={`Back to ${todoStatusCardLabel(prevStatus)}`}
              aria-label={`Move back to ${todoStatusCardLabel(prevStatus)}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(prevStatus);
              }}
            >
              <Undo2 className="size-4" aria-hidden />
            </button>
          ) : null}

          {nextStatus ? (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "text-foreground hover:bg-muted",
              )}
              disabled={!persistence}
              title={`Next: ${todoStatusCardLabel(nextStatus)}`}
              aria-label={`Move to ${todoStatusCardLabel(nextStatus)}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(nextStatus);
              }}
            >
              <span className="relative inline-flex items-center">
                <ArrowRight className="size-4" aria-hidden />
                <span className="sr-only">
                  Advance to {todoStatusCardLabel(nextStatus)}
                </span>
              </span>
            </button>
          ) : (
            <span
              className="text-emerald-500/90 inline-flex size-8 items-center justify-center"
              title="Completed"
              aria-hidden
            >
              <CheckCircle2 className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="border-border/60 mx-4 mt-3 border-b" />

      {/* Title — primary focus */}
      <button
        type="button"
        onClick={onOpen}
        className="hover:bg-muted/20 block w-full cursor-pointer px-4 pt-4 pb-3 text-left transition-colors"
      >
        <h3 className="text-foreground font-heading text-lg leading-snug font-semibold tracking-tight md:text-xl">
          {item.title}
        </h3>
        {item.category ? (
          <p className="text-muted-foreground mt-1.5 text-xs font-medium">
            {item.category}
          </p>
        ) : null}
      </button>

      {/* Footer: due pill + actions */}
      <div className="flex items-center justify-between gap-3 px-4 pb-4">
        <div className="min-w-0">
          {dueShort ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                "bg-lime-400 text-lime-950 shadow-sm",
                "dark:bg-lime-400 dark:text-lime-950",
              )}
            >
              <Calendar className="size-3.5 shrink-0 opacity-90" aria-hidden />
              {dueShort}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">No due date</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={cn(
              "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
              "inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors",
            )}
            aria-label={`Open task — ${attachmentCount} items`}
          >
            <Paperclip className="size-3.5 opacity-80" aria-hidden />
            <span className="tabular-nums">{attachmentCount}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8 rounded-lg",
              )}
              disabled={!persistence}
              aria-label="Task actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {TODO_STATUSES.filter((s) => s !== item.status).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(s)}
                  disabled={!persistence}
                >
                  Set to {todoStatusCardLabel(s)}
                </DropdownMenuItem>
              ))}
              <div className="flex items-center justify-end gap-0.5 px-1 py-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!persistence || listIndex <= 0}
                  aria-label="Move up"
                  onClick={() => onMoveInList(-1)}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!persistence || listIndex >= listLength - 1}
                  aria-label="Move down"
                  onClick={() => onMoveInList(1)}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
