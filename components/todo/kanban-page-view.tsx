"use client";

import { useEffect } from "react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { KanbanBoardClient } from "@/components/todo/kanban-board-client";
import { selectKanbanReady, useTodoStore } from "@/stores/todo-store";

function KanbanPageSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-label="Loading Kanban board"
    >
      <div className="space-y-3">
        <div className="bg-muted h-3 w-24 rounded-md" />
        <div className="bg-muted h-7 w-40 rounded-lg" />
      </div>
      <ListPlaceholder rows={4} />
    </div>
  );
}

export function KanbanPageView() {
  const boardItems = useTodoStore((s) => s.boardItems);
  const assignableUsers = useTodoStore((s) => s.assignableUsers);
  const persistence = useTodoStore((s) => s.persistence);
  const loading = useTodoStore((s) => s.loading);
  const ready = useTodoStore(selectKanbanReady);
  const ensureLoaded = useTodoStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  if (!ready && loading) {
    return <KanbanPageSkeleton />;
  }

  return (
    <KanbanBoardClient
      initialTodos={boardItems}
      persistence={persistence}
      assignableUsers={assignableUsers}
    />
  );
}
