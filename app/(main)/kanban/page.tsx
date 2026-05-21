import { PageContainer } from "@/components/layout/page-container";
import { KanbanBoardClient } from "@/components/todo/kanban-board-client";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { fetchTodosBoardSummary } from "@/lib/todo/fetch-todos";
import { getSessionUser } from "@/lib/supabase/server";
import type { TodoAssignableMember, TodoBoardItem } from "@/types/todo";

export default async function TodoPage() {
  let todos: TodoBoardItem[] = [];
  let persistence = false;
  let assignableUsers: TodoAssignableMember[] = [];

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const [assignableResult, todosResult] = await Promise.allSettled([
        fetchAssignableMembers(user),
        fetchTodosBoardSummary(),
      ]);

      if (assignableResult.status === "fulfilled") {
        assignableUsers = assignableResult.value;
      }

      if (todosResult.status === "fulfilled") {
        todos = todosResult.value;
        persistence = true;
      }
    }
  }

  return (
    <PageContainer width="wide">
      <KanbanBoardClient
        initialTodos={todos}
        persistence={persistence}
        assignableUsers={assignableUsers}
      />
    </PageContainer>
  );
}
