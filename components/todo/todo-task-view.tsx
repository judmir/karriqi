"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CommentBody } from "@/components/todo/comment-body";
import { ROUTES, todoTaskPath } from "@/config/routes";
import {
  addTodoComment,
  addTodoSubtask,
  deleteTodoItem,
  deleteTodoSubtask,
  setTodoSubtaskDone,
  updateTodoItem,
} from "@/lib/todo/todo-actions";
import { todoStatusLabel } from "@/lib/todo/status-label";
import { cn } from "@/lib/utils";
import type { TodoAssignableMember, TodoItem, TodoStatus } from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

const NO_SYNC_TOAST =
  "Tasks are not syncing. Configure Supabase and run db push before saving.";

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const textareaClassName = cn(
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30",
  "min-h-40 w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors focus-visible:ring-3",
);

export function TodoTaskView({
  initialItem,
  persistence,
  assignableUsers,
}: {
  initialItem: TodoItem;
  persistence: boolean;
  assignableUsers: TodoAssignableMember[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialItem.title);
  const [category, setCategory] = useState(initialItem.category ?? "");
  const [description, setDescription] = useState(initialItem.description ?? "");
  const [dueLocal, setDueLocal] = useState(toLocalDatetimeValue(initialItem.dueAt));
  const [progressText, setProgressText] = useState(
    initialItem.progressPercent != null ? String(initialItem.progressPercent) : "",
  );
  const [status, setStatus] = useState<TodoStatus>(initialItem.status);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(
    initialItem.assignedUserId ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [subtaskDraft, setSubtaskDraft] = useState("");

  async function saveDetails() {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const t = title.trim();
    if (!t) {
      toast.error("Title cannot be empty.");
      return;
    }

    let progressPercent: number | null | undefined;
    const pt = progressText.trim();
    if (pt === "") {
      progressPercent = null;
    } else {
      const n = Number.parseInt(pt, 10);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        toast.error("Progress must be between 0 and 100.");
        return;
      }
      progressPercent = n;
    }

    setSaving(true);
    const r = await updateTodoItem({
      id: initialItem.id,
      title: t,
      category: category.trim() || null,
      description: description.trim() || null,
      dueAt: fromLocalDatetimeValue(dueLocal),
      progressPercent,
      status,
      assignedUserId,
    });
    setSaving(false);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.refresh();
  }

  async function onAddComment() {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await addTodoComment({
      todoItemId: initialItem.id,
      body: commentDraft,
    });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setCommentDraft("");
    router.refresh();
  }

  async function onAddSubtask() {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await addTodoSubtask({
      todoItemId: initialItem.id,
      label: subtaskDraft,
    });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setSubtaskDraft("");
    router.refresh();
  }

  async function onToggleSubtask(id: string, done: boolean) {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await setTodoSubtaskDone({ id, done });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.refresh();
  }

  async function onRemoveSubtask(id: string) {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await deleteTodoSubtask({ id });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.refresh();
  }

  async function onAssigneeChange(next: string | null) {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    const r = await updateTodoItem({
      id: initialItem.id,
      assignedUserId: next,
    });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setAssignedUserId(next);
    router.refresh();
  }

  async function onDeleteItem() {
    if (!persistence) {
      toast.error(NO_SYNC_TOAST);
      return;
    }
    if (!window.confirm("Delete this task and all of its comments and steps?")) {
      return;
    }
    const r = await deleteTodoItem({ id: initialItem.id });
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    router.push(ROUTES.todo);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            href={ROUTES.todo}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to list
          </Link>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            To-do
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onDeleteItem()}
          >
            Delete
          </Button>
          <Button
            type="button"
            onClick={() => void saveDetails()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="task-title" className="sr-only">
            Title
          </Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-heading text-foreground h-auto min-h-11 border-transparent px-0 text-2xl font-semibold tracking-tight shadow-none md:text-3xl"
            placeholder="Task title"
          />
          <p className="text-muted-foreground text-xs">
            <span className="tabular-nums">ID {initialItem.id.slice(0, 8)}…</span>
            {" · "}
            <Link
              href={todoTaskPath(initialItem.id)}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              Copy link
            </Link>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <select
              id="task-status"
              className={cn(
                "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "dark:bg-input/30",
              )}
              value={status}
              onChange={(e) => setStatus(e.target.value as TodoStatus)}
            >
              {TODO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {todoStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-tag">Tag</Label>
            <Input
              id="task-tag"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Home"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-due">Due</Label>
            <Input
              id="task-due"
              type="datetime-local"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-pct">Progress %</Label>
            <Input
              id="task-pct"
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              placeholder="—"
              value={progressText}
              onChange={(e) => setProgressText(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2 xl:col-span-1">
            <Label htmlFor="task-assignee">Assigned to</Label>
            <select
              id="task-assignee"
              className={cn(
                "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "dark:bg-input/30",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              value={assignedUserId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                void onAssigneeChange(v === "" ? null : v);
              }}
              disabled={!persistence || assignableUsers.length === 0}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((m) => (
                <option key={m.userId} value={m.userId} title={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">Description</h2>
          <textarea
            id="task-desc"
            className={textareaClassName}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to happen, links, context…"
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">Checklist</h2>
          <ul className="space-y-2">
            {initialItem.subtasks.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={(e) => void onToggleSubtask(s.id, e.target.checked)}
                  className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded border bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  aria-label={`Done: ${s.label}`}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 leading-snug",
                    s.done && "text-muted-foreground line-through",
                  )}
                >
                  {s.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={`Remove ${s.label}`}
                  onClick={() => void onRemoveSubtask(s.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="Add a step"
              value={subtaskDraft}
              onChange={(e) => setSubtaskDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onAddSubtask();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={() => void onAddSubtask()}>
              Add
            </Button>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">Comments</h2>
          <p className="text-muted-foreground text-xs">
            Use <code className="text-xs">@name</code> so mentions stand out. Same account
            unless you add shared access later.
          </p>
          <ul className="border-border space-y-4 border-l-2 pl-4">
            {initialItem.comments.map((c) => (
              <li key={c.id} className="space-y-1">
                <CommentBody text={c.body} className="text-foreground text-sm" />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Add a comment… @Jamie"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onAddComment();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={() => void onAddComment()}>
              Post
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
