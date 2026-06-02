"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { KanbanCard } from "@/components/todo/kanban-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todoTaskPath } from "@/config/routes";
import {
  createTodoItem,
  deleteTodoItem,
  reorderTodoBoard,
  updateTodoItem,
} from "@/lib/todo/todo-actions";
import {
  CHECKLIST_INCOMPLETE_MESSAGE,
  isTodoBoardChecklistComplete,
} from "@/lib/todo/checklist-complete";
import { progressPercentForStatus } from "@/lib/todo/progress-for-status";
import { compareTodoItemsByPriorityAndPosition } from "@/lib/todo/priority";
import { todoStatusLabel } from "@/lib/todo/status-label";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/stores/todo-store";
import type { TodoAssignableMember, TodoBoardItem, TodoPriority, TodoStatus } from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

const NO_SYNC_TOAST =
  "Tasks are not syncing. Configure Supabase and run db push before saving.";

type ColumnMap = Record<TodoStatus, TodoBoardItem[]>;

function buildColumnMap(items: TodoBoardItem[]): ColumnMap {
  const map: ColumnMap = {
    backlog: [],
    in_progress: [],
    done: [],
  };
  const sorted = [...items].sort(compareTodoItemsByPriorityAndPosition);
  for (const item of sorted) {
    map[item.status].push(item);
  }
  return map;
}

function columnIdsRecord(map: ColumnMap): Record<TodoStatus, string[]> {
  return {
    backlog: map.backlog.map((i) => i.id),
    in_progress: map.in_progress.map((i) => i.id),
    done: map.done.map((i) => i.id),
  };
}

function isTodoStatus(s: string): s is TodoStatus {
  return (TODO_STATUSES as readonly string[]).includes(s);
}

/** Resolves which column an active drag should land in. */
function resolveTargetColumn(
  overId: string,
  itemById: Map<string, TodoBoardItem>,
): TodoStatus | null {
  if (isTodoStatus(overId)) return overId;
  const over = itemById.get(overId);
  return over ? over.status : null;
}

function totalCount(map: ColumnMap): number {
  return map.backlog.length + map.in_progress.length + map.done.length;
}

function flattenColumns(map: ColumnMap): TodoBoardItem[] {
  return [...map.backlog, ...map.in_progress, ...map.done];
}

function columnAccentClass(status: TodoStatus): string {
  switch (status) {
    case "backlog":
      return "bg-muted-foreground/60";
    case "in_progress":
      return "bg-sky-400";
    case "done":
      return "bg-emerald-400";
    default:
      return "bg-muted-foreground";
  }
}

export function KanbanBoardClient({
  initialTodos,
  persistence,
  assignableUsers,
}: {
  initialTodos: TodoBoardItem[];
  persistence: boolean;
  assignableUsers: TodoAssignableMember[];
}) {
  const router = useRouter();
  const initialColumns = useMemo(
    () => buildColumnMap(initialTodos),
    [initialTodos],
  );
  const [columns, setColumns] = useState<ColumnMap | null>(null);
  const resolvedColumns = columns ?? initialColumns;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<TodoStatus, string>>({
    backlog: "",
    in_progress: "",
    done: "",
  });
  const [openComposer, setOpenComposer] = useState<TodoStatus | null>(
    initialTodos.length === 0 ? "backlog" : null,
  );

  const dragStartLayoutRef = useRef<string | null>(null);

  function syncBoardStore(next: ColumnMap): void {
    useTodoStore.getState().setBoardItems(flattenColumns(next));
  }

  const itemById = useMemo(() => {
    const m = new Map<string, TodoBoardItem>();
    for (const list of Object.values(resolvedColumns)) {
      for (const it of list) m.set(it.id, it);
    }
    return m;
  }, [resolvedColumns]);

  const totalProgress = useMemo(() => {
    const total = totalCount(resolvedColumns);
    if (total === 0) return { done: 0, total: 0, pct: 0 };
    const done = resolvedColumns.done.length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }, [resolvedColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const persistBoard = useCallback(async (next: ColumnMap) => {
    const snapshot = flattenColumns(resolvedColumns);
    const r = await reorderTodoBoard({ columns: columnIdsRecord(next) });
    if (!r.ok) {
      toast.error(r.message);
      setColumns(buildColumnMap(snapshot));
      useTodoStore.getState().setBoardItems(snapshot);
      return;
    }
  }, [resolvedColumns]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    dragStartLayoutRef.current = JSON.stringify(columnIdsRecord(resolvedColumns));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;

    const activeItem = itemById.get(activeIdStr);
    if (!activeItem) return;

    const targetCol = resolveTargetColumn(overIdStr, itemById);
    if (!targetCol) return;

    if (activeItem.status === targetCol) return;

    if (
      targetCol === "done" &&
      !isTodoBoardChecklistComplete(activeItem)
    ) {
      return;
    }

    setColumns((prev) => {
      const current = prev ?? initialColumns;
      const next: ColumnMap = {
        backlog: [...current.backlog],
        in_progress: [...current.in_progress],
        done: [...current.done],
      };
      const sourceCol = activeItem.status;
      const sourceList = next[sourceCol];
      const idx = sourceList.findIndex((i) => i.id === activeIdStr);
      if (idx === -1) return current;
      const [moved] = sourceList.splice(idx, 1);
      if (!moved) return current;
      const updated: TodoBoardItem = {
        ...moved,
        status: targetCol,
        progressPercent: progressPercentForStatus(targetCol),
      };
      // Find insert position in target column: if over is a card in same col, before it
      const targetList = next[targetCol];
      let insertAt = targetList.length;
      if (!isTodoStatus(overIdStr)) {
        const overIdx = targetList.findIndex((i) => i.id === overIdStr);
        if (overIdx >= 0) insertAt = overIdx;
      }
      targetList.splice(insertAt, 0, updated);
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const activeItem = itemById.get(activeIdStr);
    if (!activeItem) return;
    const targetCol = resolveTargetColumn(overIdStr, itemById);
    if (!targetCol) return;

    if (
      targetCol === "done" &&
      !isTodoBoardChecklistComplete(activeItem)
    ) {
      toast.error(CHECKLIST_INCOMPLETE_MESSAGE);
      setColumns(buildColumnMap(useTodoStore.getState().boardItems));
      return;
    }

    setColumns((prev) => {
      const current = prev ?? initialColumns;
      const next: ColumnMap = {
        backlog: [...current.backlog],
        in_progress: [...current.in_progress],
        done: [...current.done],
      };
      // Locate current position of active across all columns.
      let fromCol: TodoStatus | null = null;
      let fromIdx = -1;
      for (const s of TODO_STATUSES) {
        const i = next[s].findIndex((it) => it.id === activeIdStr);
        if (i !== -1) {
          fromCol = s;
          fromIdx = i;
          break;
        }
      }
      if (!fromCol || fromIdx === -1) return current;

      const [moved] = next[fromCol].splice(fromIdx, 1);
      if (!moved) return current;
      const updated: TodoBoardItem = {
        ...moved,
        status: targetCol,
        progressPercent: progressPercentForStatus(targetCol),
      };

      const targetList = next[targetCol];
      let insertAt = targetList.length;
      if (!isTodoStatus(overIdStr) && overIdStr !== activeIdStr) {
        const overIdx = targetList.findIndex((i) => i.id === overIdStr);
        if (overIdx >= 0) {
          insertAt = overIdx;
        }
      }
      targetList.splice(insertAt, 0, updated);

      const startLayout = dragStartLayoutRef.current;
      dragStartLayoutRef.current = null;
      const nextLayout = JSON.stringify(columnIdsRecord(next));
      if (startLayout !== null && startLayout !== nextLayout) {
        syncBoardStore(next);
        void persistBoard(next);
      }
      return next;
    });
  }

  function handleDragCancel() {
    setActiveId(null);
    dragStartLayoutRef.current = null;
    setColumns(buildColumnMap(useTodoStore.getState().boardItems));
  }

  async function onAddCard(status: TodoStatus, e: FormEvent) {
    e.preventDefault();
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const title = drafts[status].trim();
    if (!title) return;
    const r = await createTodoItem({ title, status });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setDrafts((d) => ({ ...d, [status]: "" }));
    setColumns((prev) => {
      const current = prev ?? initialColumns;
      const now = new Date().toISOString();
      const created: TodoBoardItem = {
        id: r.id,
        userId: "",
        assignedUserId: null,
        title,
        category: null,
        categoryIcon: null,
        description: null,
        status,
        priority: "medium",
        position: current[status].length,
        listOrder: 999_999,
        dueAt: null,
        progressPercent: progressPercentForStatus(status),
        createdAt: now,
        updatedAt: now,
        commentCount: 0,
        subtaskCount: 0,
        subtaskDoneCount: 0,
        attachmentCount: 0,
        subtasks: [],
      };
      const next = {
        ...current,
        [status]: [...current[status], created],
      };
      syncBoardStore(next);
      return next;
    });
  }

  async function onDelete(item: TodoBoardItem) {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    if (
      !window.confirm(
        `Delete “${item.title}” and all of its comments and steps?`,
      )
    ) {
      return;
    }
    const r = await deleteTodoItem({ id: item.id });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setColumns((prev) => {
      const current = prev ?? initialColumns;
      const next: ColumnMap = {
        backlog: current.backlog.filter((i) => i.id !== item.id),
        in_progress: current.in_progress.filter((i) => i.id !== item.id),
        done: current.done.filter((i) => i.id !== item.id),
      };
      syncBoardStore(next);
      return next;
    });
  }

  async function onStatusChange(item: TodoBoardItem, status: TodoStatus) {
    if (status === item.status) return;
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    if (status === "done" && !isTodoBoardChecklistComplete(item)) {
      toast.error(CHECKLIST_INCOMPLETE_MESSAGE);
      return;
    }
    setColumns((prev) => {
      const current = prev ?? initialColumns;
      const next: ColumnMap = {
        backlog: current.backlog.filter((i) => i.id !== item.id),
        in_progress: current.in_progress.filter((i) => i.id !== item.id),
        done: current.done.filter((i) => i.id !== item.id),
      };
      next[status] = [
        ...next[status],
        {
          ...item,
          status,
          progressPercent: progressPercentForStatus(status),
        },
      ];
      syncBoardStore(next);
      void persistBoard(next);
      return next;
    });
  }

  function updateItemInColumns(
    itemId: string,
    patch: Partial<TodoBoardItem>,
  ): void {
    setColumns((prev) => {
      const current = prev ?? initialColumns;
      let changed = false;
      const next: ColumnMap = {
        backlog: current.backlog.map((item) => {
          if (item.id !== itemId) return item;
          changed = true;
          return { ...item, ...patch };
        }),
        in_progress: current.in_progress.map((item) => {
          if (item.id !== itemId) return item;
          changed = true;
          return { ...item, ...patch };
        }),
        done: current.done.map((item) => {
          if (item.id !== itemId) return item;
          changed = true;
          return { ...item, ...patch };
        }),
      };
      if (changed) {
        syncBoardStore(next);
      }
      return changed ? next : current;
    });
  }

  async function onAssign(item: TodoBoardItem, userId: string | null) {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await updateTodoItem({ id: item.id, assignedUserId: userId });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    updateItemInColumns(item.id, { assignedUserId: userId });
  }

  async function onPriorityChange(item: TodoBoardItem, priority: TodoPriority) {
    if (priority === item.priority) return;
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await updateTodoItem({ id: item.id, priority });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    updateItemInColumns(item.id, { priority });
  }

  const activeItem = activeId ? itemById.get(activeId) ?? null : null;

  return (
    <div className="space-y-6">
      {!persistence ? (
        <p className="text-muted-foreground border-border rounded-lg border border-dashed p-4 text-sm">
          Saved tasks could not be loaded. If you just added the latest todo
          migration, run <code className="text-xs">supabase db push</code> and
          reload.
        </p>
      ) : null}

      {persistence && totalProgress.total > 0 ? (
        <div className="border-border bg-card flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-sm font-medium">
              Board progress
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {totalProgress.done}/{totalProgress.total} completed
            </span>
          </div>
          <div
            className="bg-muted h-2 w-full overflow-hidden rounded-full sm:max-w-sm"
            role="progressbar"
            aria-valuenow={totalProgress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Share of tasks marked completed"
          >
            <div
              className="bg-emerald-400 h-2 rounded-full transition-[width] duration-300"
              style={{ width: `${totalProgress.pct}%` }}
            />
          </div>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={cn(
            "flex gap-4 overflow-x-auto pb-3",
            "snap-x snap-mandatory sm:snap-none",
            "-mx-4 px-4 sm:mx-0 sm:px-0",
          )}
        >
          {TODO_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={resolvedColumns[status]}
              persistence={persistence}
              assignableUsers={assignableUsers}
              composerOpen={openComposer === status}
              draftTitle={drafts[status]}
              onDraftChange={(v) =>
                setDrafts((d) => ({ ...d, [status]: v }))
              }
              onOpenComposer={() =>
                setOpenComposer((cur) => (cur === status ? null : status))
              }
              onSubmitComposer={(e) => void onAddCard(status, e)}
              onOpenItem={(item) => router.push(todoTaskPath(item.id))}
              onDeleteItem={(item) => void onDelete(item)}
              onChangeItemStatus={(item, s) => void onStatusChange(item, s)}
              onAssignItem={(item, userId) => void onAssign(item, userId)}
              onChangeItemPriority={(item, p) => void onPriorityChange(item, p)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200 }}>
          {activeItem ? (
            <div className="w-full max-w-[320px] rotate-1">
              <KanbanCard
                item={activeItem}
                persistence={persistence}
                assignableUsers={assignableUsers}
                isOverlay
                onOpen={() => {}}
                onDelete={() => {}}
                onStatusChange={() => {}}
                onAssign={() => {}}
                onPriorityChange={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  status,
  items,
  persistence,
  assignableUsers,
  composerOpen,
  draftTitle,
  onDraftChange,
  onOpenComposer,
  onSubmitComposer,
  onOpenItem,
  onDeleteItem,
  onChangeItemStatus,
  onAssignItem,
  onChangeItemPriority,
}: {
  status: TodoStatus;
  items: TodoBoardItem[];
  persistence: boolean;
  assignableUsers: TodoAssignableMember[];
  composerOpen: boolean;
  draftTitle: string;
  onDraftChange: (v: string) => void;
  onOpenComposer: () => void;
  onSubmitComposer: (e: FormEvent) => void;
  onOpenItem: (item: TodoBoardItem) => void;
  onDeleteItem: (item: TodoBoardItem) => void;
  onChangeItemStatus: (item: TodoBoardItem, status: TodoStatus) => void;
  onAssignItem: (item: TodoBoardItem, userId: string | null) => void;
  onChangeItemPriority: (item: TodoBoardItem, priority: TodoPriority) => void;
}) {
  return (
    <section
      aria-label={`${todoStatusLabel(status)} column`}
      className={cn(
        "border-border bg-muted/40 flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border p-3",
        "sm:w-[320px]",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              columnAccentClass(status),
            )}
            aria-hidden
          />
          <h2 className="text-foreground font-heading text-sm font-semibold">
            {todoStatusLabel(status)}
          </h2>
          <span
            className={cn(
              "text-muted-foreground bg-muted inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
            )}
          >
            {items.length}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Add card to ${todoStatusLabel(status)}`}
          onClick={onOpenComposer}
          disabled={!persistence}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </header>

      <ColumnDroppable status={status}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                persistence={persistence}
                assignableUsers={assignableUsers}
                onOpen={() => onOpenItem(item)}
                onDelete={() => onDeleteItem(item)}
                onStatusChange={(s) => onChangeItemStatus(item, s)}
                onAssign={(userId) => onAssignItem(item, userId)}
                onPriorityChange={(p) => onChangeItemPriority(item, p)}
              />
            ))}
            {items.length === 0 ? (
              <div className="text-muted-foreground border-border/60 rounded-xl border border-dashed px-3 py-6 text-center text-xs">
                Drop tasks here
              </div>
            ) : null}
          </div>
        </SortableContext>
      </ColumnDroppable>

      {composerOpen ? (
        <form
          onSubmit={onSubmitComposer}
          className="mt-3 flex flex-col gap-2 px-1"
        >
          <Input
            autoFocus
            placeholder={`New ${todoStatusLabel(status).toLowerCase()} task`}
            value={draftTitle}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onOpenComposer();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={!persistence || !draftTitle.trim()}
            >
              Add card
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenComposer}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={onOpenComposer}
          disabled={!persistence}
          className={cn(
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Plus className="size-3.5" aria-hidden />
          Add card
        </button>
      )}
    </section>
  );
}

function ColumnDroppable({
  status,
  children,
}: {
  status: TodoStatus;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });
  return (
    <div
      ref={setNodeRef}
      data-over={isOver || undefined}
      className={cn(
        "rounded-xl transition-colors",
        isOver && "bg-muted/60",
      )}
    >
      {children}
    </div>
  );
}

/** Re-exported for tree-shake friendly imports in tests/storybook stubs. */
export { closestCenter as _kanbanClosestCenter };
