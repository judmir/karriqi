import { notFound } from "next/navigation";

import { TodoTaskView } from "@/components/todo/todo-task-view";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { isUuid } from "@/lib/shopping/is-uuid";
import { fetchTodoByIdForUser } from "@/lib/todo/fetch-todos";
import { getSessionUser } from "@/lib/supabase/server";
import type { TodoAssignableMember } from "@/types/todo";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TodoTaskPage({ params }: Props) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const user = await getSessionUser();
  if (!user) {
    notFound();
  }

  let item = null;
  try {
    item = await fetchTodoByIdForUser(id);
  } catch {
    notFound();
  }

  if (!item) {
    notFound();
  }

  let assignableUsers: TodoAssignableMember[] = [];
  try {
    assignableUsers = await fetchAssignableMembers();
  } catch {
    assignableUsers = [];
  }

  return (
    <TodoTaskView
      key={item.updatedAt}
      initialItem={item}
      persistence
      assignableUsers={assignableUsers}
    />
  );
}
