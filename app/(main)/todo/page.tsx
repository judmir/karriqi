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
    try {
      assignableUsers = await fetchAssignableMembers();
    } catch {
      assignableUsers = [];
    }

    const user = await getSessionUser();
    if (user) {
      try {
        todos = await fetchTodosForUser();
        persistence = true;
      } catch {
        todos = [];
        persistence = false;
      }
    }
  }

  return (
    <TodoBoardClient
      initialTodos={todos}
      persistence={persistence}
      assignableUsers={assignableUsers}
    />
  );
}
