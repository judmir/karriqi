import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { TodoTaskView } from "@/components/todo/todo-task-view";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";
import { fetchTodoTagsForUser } from "@/lib/todo/fetch-todo-tags";
import { fetchTodoByIdForUser } from "@/lib/todo/fetch-todos";
import { isUuid } from "@/lib/shopping/is-uuid";
import { getSessionUser } from "@/lib/supabase/server";
import type { TodoAssignableMember, TodoTag } from "@/types/todo";

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

  const [itemResult, assignableResult, tagsResult] = await Promise.allSettled([
    fetchTodoByIdForUser(id),
    fetchAssignableMembers(user),
    fetchTodoTagsForUser(),
  ]);

  if (itemResult.status === "rejected") {
    notFound();
  }

  const item = itemResult.value;
  if (!item) {
    notFound();
  }

  let assignableUsers: TodoAssignableMember[] = [];
  if (assignableResult.status === "fulfilled") {
    assignableUsers = assignableResult.value;
  }

  let existingTags: TodoTag[] = [];
  if (tagsResult.status === "fulfilled") {
    existingTags = tagsResult.value;
  }

  return (
    <PageContainer>
      <TodoTaskView
        key={item.updatedAt}
        initialItem={item}
        persistence
        assignableUsers={assignableUsers}
        existingTags={existingTags}
      />
    </PageContainer>
  );
}
