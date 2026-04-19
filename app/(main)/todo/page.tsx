import { TodoBoardClient } from "@/components/todo/todo-board-client";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchTodosForUser } from "@/lib/todo/fetch-todos";
import { getSessionUser } from "@/lib/supabase/server";
import type { TodoItem } from "@/types/todo";

export default async function TodoPage() {
  let todos: TodoItem[] = [];
  let persistence = false;
  let ownerEmail = "";

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    ownerEmail = user?.email ?? "";
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
      ownerEmail={ownerEmail}
    />
  );
}
