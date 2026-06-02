"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Check,
  ListChecks,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { PriorityBadge, PriorityMenuLabel } from "@/components/todo/priority-icon";
import { TodoTagChip } from "@/components/todo/tag-input";
import { isTodoBoardChecklistComplete } from "@/lib/todo/checklist-complete";
import { todoStatusLabel } from "@/lib/todo/status-label";
import { cn } from "@/lib/utils";
import type { TodoAssignableMember, TodoBoardItem, TodoPriority, TodoStatus } from "@/types/todo";
import { TODO_PRIORITIES, TODO_STATUSES } from "@/types/todo";

function assigneeFor(
  assigneeUserId: string | null,
  members: TodoAssignableMember[],
): TodoAssignableMember | null {
  if (!assigneeUserId) return null;
  return members.find((m) => m.userId === assigneeUserId) ?? null;
}

function formatDueBadge(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clampProgress(n: number | null | undefined): number {
  if (n === null || n === undefined || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function progressTone(value: number): string {
  if (value >= 100) return "text-emerald-400";
  if (value > 0) return "text-sky-400";
  return "text-muted-foreground/60";
}

function CircularProgress({
  value,
  size = 18,
  stroke = 2.5,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted-foreground/25"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn("transition-all", progressTone(value))}
        fill="none"
      />
    </svg>
  );
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
  onPriorityChange,
}: {
  item: TodoBoardItem;
  persistence: boolean;
  assignableUsers: TodoAssignableMember[];
  /** When true, render without sortable wiring (used inside DragOverlay). */
  isOverlay?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onStatusChange: (status: TodoStatus) => void;
  onAssign: (userId: string | null) => void;
  onPriorityChange: (priority: TodoPriority) => void;
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
  const assignee = assigneeFor(assigneeUserId, assignableUsers);
  const assigneeLabel =
    assignee?.displayName ?? (assigneeUserId ? "Unknown" : null);
  const dueShort = formatDueBadge(item.dueAt);
  const commentCount = item.commentCount;
  const attachmentCount = item.attachmentCount;
  const subtaskTotal = item.subtaskCount;
  const subtaskDone = item.subtaskDoneCount;
  const checklistComplete = isTodoBoardChecklistComplete(item);
  const blockedMoveToDone =
    item.status !== "done" && subtaskTotal > 0 && !checklistComplete;
  const progress = clampProgress(item.progressPercent);
  const hasProgress =
    item.progressPercent !== null && item.progressPercent !== undefined;

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      data-dragging={isDragging || undefined}
      aria-label={`Open task ${item.title}`}
      onClick={(e) => {
        if (isOverlay) return;
        // Inner interactive controls call stopPropagation; this only fires
        // when the user actually clicked the card body and not a child
        // button or menu trigger.
        if (e.defaultPrevented) return;
        onOpen();
      }}
      className={cn(
        "group/card border-border bg-card text-card-foreground relative flex flex-col gap-3 rounded-2xl border p-4 text-left",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "transition-[box-shadow,border-color,transform]",
        "hover:border-border/80 hover:shadow-md",
        persistence && !isOverlay && "cursor-pointer active:cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "ring-ring/40 cursor-grabbing shadow-xl ring-2",
      )}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      {/* Header: visible priority badge + title + actions menu. */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <PriorityBadge priority={item.priority} />
          <h3 className="text-foreground font-heading text-[15px] leading-snug font-semibold tracking-tight">
            {item.title}
          </h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-muted-foreground hover:text-foreground -mr-1.5 -mt-1.5 h-7 w-7 shrink-0",
            )}
            disabled={!persistence}
            aria-label="Card actions"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
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
            {TODO_PRIORITIES.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => onPriorityChange(p)}
                disabled={!persistence || p === item.priority}
              >
                <PriorityMenuLabel priority={p} selected={p === item.priority} />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {TODO_STATUSES.filter((s) => s !== item.status).map((s) => {
              const disabled =
                !persistence || (s === "done" && blockedMoveToDone);
              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(s)}
                  disabled={disabled}
                  title={
                    s === "done" && blockedMoveToDone
                      ? "Complete all checklist items first"
                      : undefined
                  }
                >
                  Move to {todoStatusLabel(s)}
                </DropdownMenuItem>
              );
            })}
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
        <p className="text-muted-foreground line-clamp-2 text-[13px] leading-snug">
          {item.description}
        </p>
      ) : null}

      {/* Middle row: assignee avatar + due pill (left) + circular progress (right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "ring-card shrink-0 rounded-full ring-2 ring-offset-0 outline-none",
                "focus-visible:ring-ring focus-visible:ring-2",
                "data-[state=open]:ring-ring",
                (!persistence || assignableUsers.length === 0) &&
                  "cursor-not-allowed",
              )}
              disabled={!persistence || assignableUsers.length === 0}
              title={
                assignableUsers.length === 0
                  ? "No one else to assign to yet"
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
              onPointerDown={(e) => e.stopPropagation()}
            >
              {assigneeUserId ? (
                <UserAvatar
                  size="sm"
                  seed={assigneeUserId}
                  displayName={assigneeLabel}
                  avatarPreset={assignee?.avatarPreset ?? null}
                  ariaLabel={assigneeLabel ?? "Assigned"}
                  className="pointer-events-none ring-card ring-2 ring-offset-0"
                  fallbackClassName="text-[10px]"
                />
              ) : (
                <Avatar
                  size="sm"
                  className="pointer-events-none ring-card ring-2 ring-offset-0 opacity-80"
                >
                  <AvatarFallback className="text-muted-foreground text-[10px] font-medium">
                    ?
                  </AvatarFallback>
                </Avatar>
              )}
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
              title={item.dueAt ? new Date(item.dueAt).toLocaleString() : undefined}
            >
              <Calendar className="size-3 shrink-0 opacity-90" aria-hidden />
              {dueShort}
            </span>
          ) : null}
        </div>

        <span
          className={cn(
            "border-border/70 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
            hasProgress ? progressTone(progress) : "text-muted-foreground/70",
          )}
          aria-label={hasProgress ? `Progress ${progress}%` : "No progress set"}
          title={hasProgress ? `Progress ${progress}%` : "No progress set"}
        >
          <CircularProgress value={progress} />
          <span>{progress}%</span>
        </span>
      </div>

      <div className="border-border/60 -mx-4 border-t" aria-hidden />

      {/* Footer: category chip + always-visible attachment / comment counters */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {item.category ? (
            <TodoTagChip label={item.category} icon={item.categoryIcon} />
          ) : (
            <span className="text-muted-foreground/70 text-[11px]">
              No tag
            </span>
          )}
        </div>

        <div
          className="text-muted-foreground flex shrink-0 items-center gap-3 text-[11px] font-medium tabular-nums"
          aria-hidden={false}
        >
          <span
            className="inline-flex items-center gap-1"
            aria-label={
              subtaskTotal > 0
                ? `Checklist ${subtaskDone} of ${subtaskTotal} done`
                : "No checklist items"
            }
            title={
              subtaskTotal > 0
                ? `Checklist ${subtaskDone}/${subtaskTotal}`
                : "No checklist items"
            }
          >
            <ListChecks className="size-3.5" aria-hidden />
            <span>
              {subtaskTotal > 0 ? `${subtaskDone}/${subtaskTotal}` : 0}
            </span>
          </span>
          <span
            className="inline-flex items-center gap-1"
            aria-label={
              attachmentCount === 1
                ? "1 attachment"
                : `${attachmentCount} attachments`
            }
            title={
              attachmentCount === 1
                ? "1 attachment"
                : `${attachmentCount} attachments`
            }
          >
            <Paperclip className="size-3.5" aria-hidden />
            <span>{attachmentCount}</span>
          </span>
          <span
            className="inline-flex items-center gap-1"
            aria-label={
              commentCount === 1 ? "1 comment" : `${commentCount} comments`
            }
            title={
              commentCount === 1 ? "1 comment" : `${commentCount} comments`
            }
          >
            <MessageSquare className="size-3.5" aria-hidden />
            <span>{commentCount}</span>
          </span>
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
