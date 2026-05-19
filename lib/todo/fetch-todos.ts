import { createClient } from "@/lib/supabase/server";
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
  position: number;
  list_order: number;
  due_at: string | null;
  progress_percent: number | null;
  assigned_user_id: string | null;
  created_at: string;
  updated_at: string;
  todo_comments: CommentRow[] | null;
  todo_subtasks: SubtaskRow[] | null;
  todo_attachments: AttachmentRow[] | null;
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
  signedUrlsByAttachmentId: Map<string, string>,
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
  const attachments = (row.todo_attachments ?? [])
    .map((a) => mapAttachment(a, signedUrlsByAttachmentId.get(a.id) ?? null))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  return {
    id: row.id,
    userId: row.user_id,
    assignedUserId: row.assigned_user_id,
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
    attachments,
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
  ),
  todo_attachments (
    id,
    todo_item_id,
    user_id,
    file_name,
    mime_type,
    size_bytes,
    storage_path,
    created_at
  )
`;

async function signAttachmentUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ItemRow[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const all: { id: string; path: string }[] = [];
  for (const row of rows) {
    for (const att of row.todo_attachments ?? []) {
      all.push({ id: att.id, path: att.storage_path });
    }
  }
  if (all.length === 0) {
    return result;
  }

  // createSignedUrls accepts an array of paths and returns parallel results.
  const { data } = await supabase.storage
    .from(TODO_ATTACHMENT_BUCKET)
    .createSignedUrls(
      all.map((a) => a.path),
      ATTACHMENT_SIGNED_URL_SECONDS,
    );

  (data ?? []).forEach((entry, idx) => {
    const meta = all[idx];
    if (meta && entry.signedUrl) {
      result.set(meta.id, entry.signedUrl);
    }
  });

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
  const signed = await signAttachmentUrls(supabase, rows);
  return rows.map((row) => mapItem(row, signed));
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
  const signed = await signAttachmentUrls(supabase, [row]);
  return mapItem(row, signed);
}
