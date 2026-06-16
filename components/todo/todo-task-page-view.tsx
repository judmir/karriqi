"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TodoTaskView } from "@/components/todo/todo-task-view";
import { ROUTES } from "@/config/routes";
import { loadTodoTaskAction } from "@/stores/load-actions";
import { useTodoStore } from "@/stores/todo-store";
import type { TodoAssignableMember, TodoItem, TodoTag } from "@/types/todo";

function TodoTaskPageSkeleton({ title }: { title?: string }) {
  return (
    <div className="space-y-8" role="status" aria-label="Loading task">
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
      {title ? (
        <h1 className="font-heading text-foreground text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          {title}
        </h1>
      ) : (
        <div className="bg-muted h-9 w-2/3 max-w-md animate-pulse rounded-lg" />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-8 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="bg-muted h-40 animate-pulse rounded-xl" />
    </div>
  );
}

type LoadedTask = {
  item: TodoItem;
  assignableUsers: TodoAssignableMember[];
  existingTags: TodoTag[];
  persistence: boolean;
};

export function TodoTaskPageView({ taskId }: { taskId: string }) {
  const boardItem = useTodoStore((s) =>
    s.boardItems.find((item) => item.id === taskId),
  );
  const ensureLoaded = useTodoStore((s) => s.ensureLoaded);
  const [loaded, setLoaded] = useState<LoadedTask | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void ensureLoaded();
    setLoaded(null);
    setMissing(false);
    setLoading(true);

    void loadTodoTaskAction(taskId).then((result) => {
      if (cancelled) return;

      if (!result.ok) {
        setMissing(true);
        setLoading(false);
        return;
      }

      setLoaded({
        item: result.item,
        assignableUsers: result.assignableUsers,
        existingTags: result.existingTags,
        persistence: result.persistence,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ensureLoaded, taskId]);

  if (loading) {
    return <TodoTaskPageSkeleton title={boardItem?.title} />;
  }

  if (missing || !loaded) {
    return (
      <div className="space-y-4">
        <Link
          href={ROUTES.todo}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to list
        </Link>
        <p className="text-muted-foreground text-sm">Task not found.</p>
      </div>
    );
  }

  return (
    <TodoTaskView
      key={loaded.item.updatedAt}
      initialItem={loaded.item}
      persistence={loaded.persistence}
      assignableUsers={loaded.assignableUsers}
      existingTags={loaded.existingTags}
    />
  );
}
