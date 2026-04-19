"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Section } from "@/components/patterns/section";
import { TodoCard } from "@/components/todo/todo-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todoTaskPath } from "@/config/routes";
import { createTodoItem, reorderTodoList, updateTodoItem } from "@/lib/todo/todo-actions";
import { cn } from "@/lib/utils";
import type { TodoAssignableMember, TodoItem, TodoStatus } from "@/types/todo";

export function TodoBoardClient({
  initialTodos,
  persistence,
  assignableUsers,
}: {
  initialTodos: TodoItem[];
  persistence: boolean;
  assignableUsers: TodoAssignableMember[];
}) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("");

  const sorted = useMemo(
    () =>
      [...initialTodos].sort((a, b) => a.listOrder - b.listOrder),
    [initialTodos],
  );

  const listProgress = useMemo(() => {
    const total = sorted.length;
    if (total === 0) return { done: 0, total: 0, pct: 0 };
    const done = sorted.filter((t) => t.status === "done").length;
    return {
      done,
      total,
      pct: Math.round((done / total) * 100),
    };
  }, [sorted]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!persistence) {
      toast.error(
        "Tasks are not syncing. Configure Supabase and run db push before saving.",
      );
      return;
    }
    const t = draftTitle.trim();
    if (!t) return;
    const r = await createTodoItem({
      title: t,
      status: "backlog",
      category: draftCategory.trim() || null,
    });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setDraftTitle("");
    setDraftCategory("");
    router.push(todoTaskPath(r.id));
    router.refresh();
  }

  async function onStatusChange(item: TodoItem, status: TodoStatus) {
    if (status === item.status) return;
    if (!persistence) {
      toast.error(
        "Tasks are not syncing. Configure Supabase and run db push before saving.",
      );
      return;
    }
    const r = await updateTodoItem({ id: item.id, status });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.refresh();
  }

  async function onAssign(item: TodoItem, userId: string | null) {
    if (!persistence) {
      toast.error(
        "Tasks are not syncing. Configure Supabase and run db push before saving.",
      );
      return;
    }
    const r = await updateTodoItem({ id: item.id, assignedUserId: userId });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.refresh();
  }

  async function onMoveInList(item: TodoItem, dir: -1 | 1) {
    if (!persistence) {
      toast.error(
        "Tasks are not syncing. Configure Supabase and run db push before saving.",
      );
      return;
    }
    const idx = sorted.findIndex((x) => x.id === item.id);
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const nextOrder = [...sorted];
    const tmp = nextOrder[idx];
    nextOrder[idx] = nextOrder[j];
    nextOrder[j] = tmp;
    const r = await reorderTodoList({
      orderedIds: nextOrder.map((x) => x.id),
    });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="space-y-8">
        <header className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Module
          </p>
          <h1 className="font-heading text-foreground text-2xl font-semibold">
            To-do
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            Open a card to view or edit the full task — description, checklist,
            and comments.
          </p>
        </header>

        {!persistence ? (
          <p className="text-muted-foreground border-border rounded-lg border border-dashed p-4 text-sm">
            Saved tasks could not be loaded. If you just added the latest todo
            migration, run{" "}
            <code className="text-xs">supabase db push</code> and reload.
          </p>
        ) : null}

        {persistence && listProgress.total > 0 ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground text-sm font-medium">
                List progress
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {listProgress.done}/{listProgress.total} completed
              </span>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={listProgress.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of tasks marked completed"
            >
              <div
                className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-[width] duration-300"
                style={{ width: `${listProgress.pct}%` }}
              />
            </div>
          </div>
        ) : null}

        <Section title="New card">
          <form
            onSubmit={(e) => void onCreate(e)}
            className="flex flex-col gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-todo-title">Title</Label>
                <Input
                  id="new-todo-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. Do taxes"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-todo-tag">Tag (optional)</Label>
                <Input
                  id="new-todo-tag"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  placeholder="e.g. Home, Work"
                />
              </div>
            </div>
            <div>
              <Button type="submit">Add card</Button>
            </div>
          </form>
        </Section>

        <Section title="Tasks">
          <ul className="flex flex-col gap-4">
            {sorted.map((item, index) => (
              <li key={item.id} className="list-none">
                <TodoCard
                  item={item}
                  listIndex={index}
                  listLength={sorted.length}
                  persistence={persistence}
                  assignableUsers={assignableUsers}
                  onOpen={() => router.push(todoTaskPath(item.id))}
                  onStatusChange={(s) => void onStatusChange(item, s)}
                  onMoveInList={(d) => void onMoveInList(item, d)}
                  onAssign={(email) => void onAssign(item, email)}
                />
              </li>
            ))}
          </ul>
          {sorted.length === 0 && persistence ? (
            <p
              className={cn(
                "text-muted-foreground border-border rounded-xl border border-dashed p-6 text-center text-sm",
              )}
            >
              No tasks yet. Add a card above.
            </p>
          ) : null}
        </Section>
      </div>
    </>
  );
}
