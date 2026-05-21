import { createClient } from "@/lib/supabase/server";
import { normalizeTodoPriority } from "@/lib/todo/priority";
import type {
  TodoAttachment,
  TodoComment,
  TodoItem,
  TodoStatus,
  TodoSubtask,
} from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

const ATTACHMENT_SIGNED_URL_SECONDS = 60 * 60;
const TODO_ATTACHMENT_BUCKET = "todo-attachments";

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

type AttachmentRow = {
  id: string;
  todo_item_id: string;
  user_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
};

type ItemRow = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  description: string | null;
  status: string;
  priority: string | null;
  position: number;
  list_order: number;
  due_at: string | null;
  progress_percent: number | null;
  assigned_user_id: string | null;
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

function mapAttachment(
  row: AttachmentRow,
  signedUrl: string | null,
): TodoAttachment {
  return {
    id: row.id,
    todoItemId: row.todo_item_id,
    userId: row.user_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    signedUrl,
    createdAt: row.created_at,
  };
}

function isTodoStatus(s: string): s is TodoStatus {
  return (TODO_STATUSES as readonly string[]).includes(s);
}

function mapItem(
  row: ItemRow,
  attachmentsByItem: Map<string, TodoAttachment[]>,
): TodoItem {
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
  const attachments = attachmentsByItem.get(row.id) ?? [];

  return {
    id: row.id,
    userId: row.user_id,
    assignedUserId: row.assigned_user_id,
    title: row.title,
    category: row.category,
    description: row.description,
    status,
    priority: normalizeTodoPriority(row.priority),
    position: row.position,
    listOrder: row.list_order,
    dueAt: row.due_at,
    progressPercent: row.progress_percent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comments,
    subtasks,
    attachments,
  };
}

// Embedded relations are queried in the same round-trip via Supabase's
// implicit FK joins. `todo_attachments` is fetched separately so the page
// keeps working even if that migration has not been pushed to the linked
// project yet (we just treat any error as "no attachments").
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

async function fetchAttachmentsForItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemIds: string[],
): Promise<Map<string, TodoAttachment[]>> {
  const result = new Map<string, TodoAttachment[]>();
  if (itemIds.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from("todo_attachments")
    .select(
      "id, todo_item_id, user_id, file_name, mime_type, size_bytes, storage_path, created_at",
    )
    .in("todo_item_id", itemIds)
    .order("created_at", { ascending: true });

  // Tolerate the table not yet existing on the remote (migration not pushed)
  // or any other read error: just return an empty map so the page still
  // renders the rest of the todo state.
  if (error || !data) {
    return result;
  }

  const rows = data as unknown as AttachmentRow[];
  const paths = rows.map((r) => r.storage_path);

  const signedById = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(TODO_ATTACHMENT_BUCKET)
      .createSignedUrls(paths, ATTACHMENT_SIGNED_URL_SECONDS);
    (signed ?? []).forEach((entry, idx) => {
      const row = rows[idx];
      if (row && entry.signedUrl) {
        signedById.set(row.id, entry.signedUrl);
      }
    });
  }

  for (const row of rows) {
    const list = result.get(row.todo_item_id) ?? [];
    list.push(mapAttachment(row, signedById.get(row.id) ?? null));
    result.set(row.todo_item_id, list);
  }

  return result;
}

export async function fetchTodosForUser(): Promise<TodoItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todo_items")
    .select(TODO_ITEM_SELECT)
    .order("list_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as ItemRow[];
  const attachmentsByItem = await fetchAttachmentsForItems(
    supabase,
    rows.map((r) => r.id),
  );
  return rows.map((row) => mapItem(row, attachmentsByItem));
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

  const row = data as unknown as ItemRow;
  const attachmentsByItem = await fetchAttachmentsForItems(supabase, [row.id]);
  return mapItem(row, attachmentsByItem);
}
