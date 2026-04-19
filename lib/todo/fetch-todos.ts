import { createClient } from "@/lib/supabase/server";
import type { TodoComment, TodoItem, TodoStatus, TodoSubtask } from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

type CommentRow = {
  id: string;
  todo_item_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type SubtaskRow = {
  id: string;
  todo_item_id: string;
  label: string;
  done: boolean;
  position: number;
};

type ItemRow = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  description: string | null;
  status: string;
  position: number;
  list_order: number;
  due_at: string | null;
  progress_percent: number | null;
  created_at: string;
  updated_at: string;
  todo_comments: CommentRow[] | null;
  todo_subtasks: SubtaskRow[] | null;
};

function mapComment(row: CommentRow): TodoComment {
  return {
    id: row.id,
    todoItemId: row.todo_item_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapSubtask(row: SubtaskRow): TodoSubtask {
  return {
    id: row.id,
    todoItemId: row.todo_item_id,
    label: row.label,
    done: row.done,
    position: row.position,
  };
}

function isTodoStatus(s: string): s is TodoStatus {
  return (TODO_STATUSES as readonly string[]).includes(s);
}

function mapItem(row: ItemRow): TodoItem {
  const status = isTodoStatus(row.status) ? row.status : "backlog";
  const comments = (row.todo_comments ?? [])
    .map(mapComment)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const subtasks = (row.todo_subtasks ?? [])
    .map(mapSubtask)
    .sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    description: row.description,
    status,
    position: row.position,
    listOrder: row.list_order,
    dueAt: row.due_at,
    progressPercent: row.progress_percent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comments,
    subtasks,
  };
}

const TODO_ITEM_SELECT = `
  *,
  todo_comments (
    id,
    todo_item_id,
    user_id,
    body,
    created_at
  ),
  todo_subtasks (
    id,
    todo_item_id,
    label,
    done,
    position
  )
`;

export async function fetchTodosForUser(): Promise<TodoItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todo_items")
    .select(TODO_ITEM_SELECT)
    .order("list_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapItem(row as ItemRow));
}

export async function fetchTodoByIdForUser(id: string): Promise<TodoItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todo_items")
    .select(TODO_ITEM_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapItem(data as ItemRow);
}
