"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Check,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { todoStatusLabel } from "@/lib/todo/status-label";
import { cn } from "@/lib/utils";
import type { TodoAssignableMember, TodoItem, TodoStatus } from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

function initialsFromDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    const s = (a + b).toUpperCase();
    return s || "?";
  }
  const p = parts[0] ?? name.trim();
  if (p.length >= 2) return p.slice(0, 2).toUpperCase();
  return p.toUpperCase() || "?";
}

function displayNameForAssignee(
  assigneeUserId: string | null,
  members: TodoAssignableMember[],
): string | null {
  if (!assigneeUserId) return null;
  return (
    members.find((m) => m.userId === assigneeUserId)?.displayName ?? null
  );
}

function formatDueBadge(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clampProgress(n: number | null | undefined): number | null {
  if (n === null || n === undefined) return null;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function KanbanCard({
  item,
  persistence,
  assignableUsers,
  isOverlay = false,
  onOpen,
  onDelete,
  onStatusChange,
  onAssign,
}: {
  item: TodoItem;
  persistence: boolean;
  assignableUsers: TodoAssignableMember[];
  /** When true, render without sortable wiring (used inside DragOverlay). */
  isOverlay?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onStatusChange: (status: TodoStatus) => void;
  onAssign: (userId: string | null) => void;
}) {
  const sortable = useSortable({
    id: item.id,
    disabled: isOverlay || !persistence,
    data: { type: "card", status: item.status },
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assigneeUserId = item.assignedUserId;
  const assigneeLabel =
    displayNameForAssignee(assigneeUserId, assignableUsers) ??
    (assigneeUserId ? "Unknown" : null);
  const initials =
    assigneeUserId && assigneeLabel
      ? initialsFromDisplayName(assigneeLabel)
      : "?";
  const dueShort = formatDueBadge(item.dueAt);
  const commentCount = item.comments.length;
  const subtaskTotal = item.subtasks.length;
  const subtaskDone = item.subtasks.filter((s) => s.done).length;
  const progress = clampProgress(item.progressPercent);

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      data-dragging={isDragging || undefined}
      className={cn(
        "group/card border-border bg-card text-card-foreground relative flex flex-col gap-3 rounded-2xl border p-3",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "transition-[box-shadow,border-color,transform]",
        "hover:border-border/80 hover:shadow-md",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "ring-ring/40 cursor-grabbing shadow-xl ring-2",
      )}
    >
      {/* Header: drag handle + title (title click opens) */}
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground -ml-1 mt-0.5 inline-flex size-6 cursor-grab items-center justify-center rounded-md outline-none",
            "focus-visible:ring-ring focus-visible:ring-2",
            isDragging && "cursor-grabbing",
            !persistence && "cursor-not-allowed opacity-50",
          )}
          aria-label="Drag task"
          disabled={!persistence}
          {...(isOverlay ? {} : attributes)}
          {...(isOverlay ? {} : listeners)}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="hover:text-primary -ml-1 min-w-0 flex-1 cursor-pointer text-left"
        >
          <h3 className="text-foreground font-heading text-sm leading-snug font-semibold tracking-tight">
            {item.title}
          </h3>
          {item.category ? (
            <p className="text-muted-foreground mt-0.5 text-[11px] font-medium">
              {item.category}
            </p>
          ) : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-muted-foreground hover:text-foreground -mr-1 -mt-1 h-7 w-7",
            )}
            disabled={!persistence}
            aria-label="Card actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-44"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onClick={onOpen}>
              <Pencil className="size-4" aria-hidden />
              <span>Open / edit</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {TODO_STATUSES.filter((s) => s !== item.status).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onStatusChange(s)}
                disabled={!persistence}
              >
                Move to {todoStatusLabel(s)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={onDelete}
              disabled={!persistence}
            >
              <Trash2 className="size-4" aria-hidden />
              <span>Delete card</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.description ? (
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {item.description}
        </p>
      ) : null}

      {progress !== null ? (
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center justify-between text-[11px] tabular-nums">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div
            className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress ${progress}%`}
          >
            <div
              className={cn(
                "h-1.5 rounded-full transition-[width] duration-300",
                progress >= 100
                  ? "bg-emerald-400"
                  : progress > 0
                    ? "bg-sky-400"
                    : "bg-muted-foreground/40",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Footer: assignee + due + counts */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "ring-background shrink-0 rounded-full ring-2 ring-offset-0 outline-none",
                "focus-visible:ring-ring focus-visible:ring-2",
                "data-[state=open]:ring-ring",
                (!persistence || assignableUsers.length === 0) &&
                  "cursor-not-allowed",
              )}
              disabled={!persistence || assignableUsers.length === 0}
              title={
                assignableUsers.length === 0
                  ? "Add household members to assign others"
                  : assigneeUserId
                    ? assigneeLabel
                      ? `Assigned — ${assigneeLabel}`
                      : "Assigned"
                    : "Assign task"
              }
              aria-label={
                assigneeUserId
                  ? `Assigned to ${assigneeLabel ?? "unknown"}. Change assignee`
                  : "Assign task"
              }
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                size="sm"
                className={cn(
                  "pointer-events-none ring-background ring-2 ring-offset-0",
                  !assigneeUserId && "opacity-80",
                )}
              >
                <AvatarFallback
                  className={cn(
                    "text-[10px] font-medium",
                    !assigneeUserId && "text-muted-foreground",
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-48"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => onAssign(null)}
                className="flex items-center justify-between gap-2"
              >
                <span>Unassigned</span>
                {!assigneeUserId ? (
                  <Check
                    className="text-foreground size-4 shrink-0"
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
              {assignableUsers.map((m) => {
                const selected = assigneeUserId === m.userId;
                return (
                  <DropdownMenuItem
                    key={m.userId}
                    title={m.userId}
                    onClick={() => onAssign(m.userId)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{m.displayName}</span>
                    {selected ? (
                      <Check
                        className="text-foreground size-4 shrink-0"
                        aria-hidden
                      />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {dueShort ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                "bg-lime-400 text-lime-950 shadow-sm",
              )}
            >
              <Calendar className="size-3 shrink-0 opacity-90" aria-hidden />
              {dueShort}
            </span>
          ) : null}
        </div>

        <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-[11px] font-medium tabular-nums">
          {subtaskTotal > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="hover:text-foreground inline-flex items-center gap-1"
              aria-label={`Checklist ${subtaskDone} of ${subtaskTotal} done`}
            >
              <Check className="size-3.5" aria-hidden />
              <span>
                {subtaskDone}/{subtaskTotal}
              </span>
            </button>
          ) : null}
          {commentCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="hover:text-foreground inline-flex items-center gap-1"
              aria-label={`${commentCount} comments`}
            >
              <MessageSquare className="size-3.5" aria-hidden />
              <span>{commentCount}</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Lightweight wrapper used by `KanbanColumn` to render an empty-state row
 * that still participates in droppable detection. Kept here so column logic
 * stays focused on layout.
 */
export function KanbanCardEmptyHint({
  label = "Drop tasks here",
}: {
  label?: string;
}) {
  return (
    <div className="text-muted-foreground border-border/60 rounded-xl border border-dashed px-3 py-6 text-center text-xs">
      {label}
    </div>
  );
}

/** Helper that mirrors Button's variant util for the toolbar's "+ Add card". */
export function kanbanAddCardButtonClass(): string {
  return buttonVariants({ variant: "ghost", size: "sm" });
}
