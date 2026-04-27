import { PageContainer } from "@/components/layout/page-container";
import { TodoBoardClient } from "@/components/todo/todo-board-client";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { fetchTodosForUser } from "@/lib/todo/fetch-todos";
import { getSessionUser } from "@/lib/supabase/server";
import type { TodoAssignableMember, TodoItem } from "@/types/todo";

export default async function TodoPage() {
  let todos: TodoItem[] = [];
  let persistence = false;
  let assignableUsers: TodoAssignableMember[] = [];

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const [assignableResult, todosResult] = await Promise.allSettled([
        fetchAssignableMembers(user),
        fetchTodosForUser(),
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
      <TodoBoardClient
        initialTodos={todos}
        persistence={persistence}
        assignableUsers={assignableUsers}
      />
    </PageContainer>
  );
}
