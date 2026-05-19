"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { isUuid } from "@/lib/shopping/is-uuid";
import { notifyTodoCommentMentions } from "@/lib/notifications/notification-events";
import { userMayAssignTask } from "@/lib/todo/fetch-assignable-members";
import { progressPercentForStatus } from "@/lib/todo/progress-for-status";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { TodoStatus } from "@/types/todo";
import { TODO_STATUSES } from "@/types/todo";

type TodoItemUpdate = Database["public"]["Tables"]["todo_items"]["Update"];

const TODO_ATTACHMENT_BUCKET = "todo-attachments";
// Keep in sync with experimental.serverActions.bodySizeLimit in next.config.ts
// and MAX_ATTACHMENT_BYTES in components/todo/todo-task-view.tsx.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function ok<T extends { ok: true }>(x: T): T {
  revalidatePath(ROUTES.todo);
  return x;
}

type Err = { ok: false; message: string };

function sanitizeAttachmentName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "file";

  // Supabase Storage refuses object keys that contain non-ASCII characters
  // (umlauts, accents, emoji, etc.) and most punctuation. Normalize to ASCII
  // and replace anything outside [A-Za-z0-9._-] with an underscore, while
  // preserving the file extension. Keep total length bounded.
  const stripped = trimmed
    .replace(/[\\/]+/g, "_")
    .replace(/[\u0000-\u001f]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const dot = stripped.lastIndexOf(".");
  const hasExt = dot > 0 && dot < stripped.length - 1;
  const baseRaw = hasExt ? stripped.slice(0, dot) : stripped;
  const extRaw = hasExt ? stripped.slice(dot + 1) : "";

  const cleanPart = (s: string) =>
    s
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[._-]+|[._-]+$/g, "");

  const base = cleanPart(baseRaw).slice(0, 100) || "file";
  const ext = cleanPart(extRaw).slice(0, 16);

  return ext ? `${base}.${ext}` : base;
}

async function clearStaleTaskReminder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  todoItemId: string,
  ownerUserId: string,
): Promise<void> {
  await supabase
    .from("todo_items")
    .update({ last_stale_notification_at: null })
    .eq("id", todoItemId)
    .eq("user_id", ownerUserId);
}

async function nextPositionForStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  status: TodoStatus,
): Promise<number> {
  const { data: rows } = await supabase
    .from("todo_items")
    .select("position")
    .eq("user_id", userId)
    .eq("status", status)
    .order("position", { ascending: false })
    .limit(1);

  return (rows?.[0]?.position ?? -1) + 1;
}

async function nextListOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number> {
  const { data: rows } = await supabase
    .from("todo_items")
    .select("list_order")
    .eq("user_id", userId)
    .order("list_order", { ascending: false })
    .limit(1);

  return (rows?.[0]?.list_order ?? -1) + 1;
}

export type CreateTodoResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createTodoItem(input: {
  title: string;
  status?: TodoStatus;
  category?: string | null;
}): Promise<CreateTodoResult> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  const status = input.status ?? "backlog";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const position = await nextPositionForStatus(supabase, user.id, status);
  const listOrder = await nextListOrder(supabase, user.id);
  const category =
    input.category !== undefined
      ? input.category?.trim() || null
      : null;

  const { data: created, error } = await supabase
    .from("todo_items")
    .insert({
      user_id: user.id,
      assigned_user_id: user.id,
      title,
      status,
      position,
      list_order: listOrder,
      category,
      progress_percent: progressPercentForStatus(status),
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, message: error?.message ?? "Insert failed." };
  }

  return ok({ ok: true, id: created.id });
}

export type UpdateTodoResult = { ok: true } | Err;

export async function updateTodoItem(input: {
  id: string;
  title?: string;
  category?: string | null;
  description?: string | null;
  dueAt?: string | null;
  progressPercent?: number | null;
  status?: TodoStatus;
  assignedUserId?: string | null;
}): Promise<UpdateTodoResult> {
  if (!isUuid(input.id)) {
    return { ok: false, message: "Invalid item id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: existing, error: readError } = await supabase
    .from("todo_items")
    .select("id, status")
    .eq("id", input.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !existing) {
    return { ok: false, message: readError?.message ?? "Item not found." };
  }

  const patch: TodoItemUpdate = {};

  if (input.title !== undefined) {
    const t = input.title.trim();
    if (!t) {
      return { ok: false, message: "Title cannot be empty." };
    }
    patch.title = t;
  }

  if (input.description !== undefined) {
    const d = input.description?.trim();
    patch.description = d ? d : null;
  }

  if (input.category !== undefined) {
    const c = input.category?.trim();
    patch.category = c ? c : null;
  }

  if (input.dueAt !== undefined) {
    patch.due_at = input.dueAt;
  }

  const statusChanging =
    input.status !== undefined && input.status !== existing.status;

  if (statusChanging) {
    patch.status = input.status;
    patch.position = await nextPositionForStatus(
      supabase,
      user.id,
      input.status!,
    );
    patch.progress_percent = progressPercentForStatus(input.status!);
  }

  if (input.progressPercent !== undefined && !statusChanging) {
    if (input.progressPercent !== null) {
      const p = input.progressPercent;
      if (p < 0 || p > 100 || !Number.isInteger(p)) {
        return { ok: false, message: "Progress must be an integer 0–100." };
      }
    }
    patch.progress_percent = input.progressPercent;
  }

  if (input.assignedUserId !== undefined) {
    const v =
      input.assignedUserId === null || input.assignedUserId.trim() === ""
        ? null
        : input.assignedUserId.trim();
    if (v !== null && !isUuid(v)) {
      return { ok: false, message: "Invalid assignee." };
    }
    const allowed = await userMayAssignTask(supabase, user.id, v);
    if (!allowed) {
      return {
        ok: false,
        message: "That assignee is not allowed for your account.",
      };
    }
    patch.assigned_user_id = v;
  }

  if (Object.keys(patch).length === 0) {
    return ok({ ok: true });
  }

  patch.last_stale_notification_at = null;

  const { error } = await supabase
    .from("todo_items")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok({ ok: true });
}

export type DeleteTodoResult = { ok: true } | Err;

export async function deleteTodoItem(input: {
  id: string;
}): Promise<DeleteTodoResult> {
  if (!isUuid(input.id)) {
    return { ok: false, message: "Invalid item id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("todo_items")
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok({ ok: true });
}

export type AddCommentResult = { ok: true } | Err;

export async function addTodoComment(input: {
  todoItemId: string;
  body: string;
}): Promise<AddCommentResult> {
  if (!isUuid(input.todoItemId)) {
    return { ok: false, message: "Invalid item id." };
  }

  const body = input.body.trim();
  if (!body) {
    return { ok: false, message: "Comment cannot be empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: parent } = await supabase
    .from("todo_items")
    .select("id, title, user_id")
    .eq("id", input.todoItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!parent) {
    return { ok: false, message: "Item not found." };
  }

  const { error } = await supabase.from("todo_comments").insert({
    todo_item_id: input.todoItemId,
    user_id: user.id,
    body,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await clearStaleTaskReminder(supabase, input.todoItemId, user.id);

  void notifyTodoCommentMentions({
    todoOwnerUserId: parent.user_id,
    todoItemId: input.todoItemId,
    todoTitle: parent.title ?? "",
    commentBody: body,
    authorUserId: user.id,
  });

  return ok({ ok: true });
}

export type AddSubtaskResult = { ok: true } | Err;

export async function addTodoSubtask(input: {
  todoItemId: string;
  label: string;
}): Promise<AddSubtaskResult> {
  if (!isUuid(input.todoItemId)) {
    return { ok: false, message: "Invalid item id." };
  }

  const label = input.label.trim();
  if (!label) {
    return { ok: false, message: "Step label is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: parent } = await supabase
    .from("todo_items")
    .select("id")
    .eq("id", input.todoItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!parent) {
    return { ok: false, message: "Item not found." };
  }

  const { data: tail } = await supabase
    .from("todo_subtasks")
    .select("position")
    .eq("todo_item_id", input.todoItemId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (tail?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("todo_subtasks").insert({
    todo_item_id: input.todoItemId,
    label,
    position,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await clearStaleTaskReminder(supabase, input.todoItemId, user.id);

  return ok({ ok: true });
}

export type SetSubtaskDoneResult = { ok: true } | Err;

export async function setTodoSubtaskDone(input: {
  id: string;
  done: boolean;
}): Promise<SetSubtaskDoneResult> {
  if (!isUuid(input.id)) {
    return { ok: false, message: "Invalid subtask id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: subRow, error: readErr } = await supabase
    .from("todo_subtasks")
    .select("todo_item_id")
    .eq("id", input.id)
    .maybeSingle();

  if (readErr || !subRow) {
    return { ok: false, message: readErr?.message ?? "Subtask not found." };
  }

  const { error } = await supabase
    .from("todo_subtasks")
    .update({ done: input.done })
    .eq("id", input.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await clearStaleTaskReminder(supabase, subRow.todo_item_id, user.id);

  return ok({ ok: true });
}

export type DeleteSubtaskResult = { ok: true } | Err;

export async function deleteTodoSubtask(input: {
  id: string;
}): Promise<DeleteSubtaskResult> {
  if (!isUuid(input.id)) {
    return { ok: false, message: "Invalid subtask id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: subRow, error: readErr } = await supabase
    .from("todo_subtasks")
    .select("todo_item_id")
    .eq("id", input.id)
    .maybeSingle();

  if (readErr || !subRow) {
    return { ok: false, message: readErr?.message ?? "Subtask not found." };
  }

  const { error } = await supabase.from("todo_subtasks").delete().eq("id", input.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await clearStaleTaskReminder(supabase, subRow.todo_item_id, user.id);

  return ok({ ok: true });
}

export type AddAttachmentResult =
  | { ok: true; id: string }
  | Err;

export async function addTodoAttachment(
  formData: FormData,
): Promise<AddAttachmentResult> {
  const todoItemId = String(formData.get("todoItemId") ?? "");
  if (!isUuid(todoItemId)) {
    return { ok: false, message: "Invalid item id." };
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { ok: false, message: "Pick a file to attach." };
  }

  if (fileEntry.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, message: "Attachments are limited to 10 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: parent } = await supabase
    .from("todo_items")
    .select("id")
    .eq("id", todoItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!parent) {
    return { ok: false, message: "Item not found." };
  }

  const safeName = sanitizeAttachmentName(fileEntry.name);
  // Random per-file id; we also use it as the row PK so the storage path
  // stays unique and points back to the attachment row.
  const attachmentId = crypto.randomUUID();
  const storagePath = `${user.id}/${todoItemId}/${attachmentId}-${safeName}`;
  const mimeType = fileEntry.type || "application/octet-stream";

  const { error: uploadError } = await supabase.storage
    .from(TODO_ATTACHMENT_BUCKET)
    .upload(storagePath, fileEntry, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { error: insertError } = await supabase.from("todo_attachments").insert({
    id: attachmentId,
    todo_item_id: todoItemId,
    user_id: user.id,
    file_name: safeName,
    mime_type: mimeType,
    size_bytes: fileEntry.size,
    storage_path: storagePath,
  });

  if (insertError) {
    // Best-effort cleanup of the uploaded blob so we do not leak orphans.
    await supabase.storage
      .from(TODO_ATTACHMENT_BUCKET)
      .remove([storagePath]);
    return { ok: false, message: insertError.message };
  }

  await clearStaleTaskReminder(supabase, todoItemId, user.id);

  return ok({ ok: true, id: attachmentId });
}

export type DeleteAttachmentResult = { ok: true } | Err;

export async function deleteTodoAttachment(input: {
  id: string;
}): Promise<DeleteAttachmentResult> {
  if (!isUuid(input.id)) {
    return { ok: false, message: "Invalid attachment id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: row, error: readErr } = await supabase
    .from("todo_attachments")
    .select("id, todo_item_id, storage_path")
    .eq("id", input.id)
    .maybeSingle();

  if (readErr || !row) {
    return { ok: false, message: readErr?.message ?? "Attachment not found." };
  }

  const { error: removeErr } = await supabase.storage
    .from(TODO_ATTACHMENT_BUCKET)
    .remove([row.storage_path]);
  if (removeErr) {
    return { ok: false, message: removeErr.message };
  }

  const { error: delErr } = await supabase
    .from("todo_attachments")
    .delete()
    .eq("id", input.id);

  if (delErr) {
    return { ok: false, message: delErr.message };
  }

  await clearStaleTaskReminder(supabase, row.todo_item_id, user.id);

  return ok({ ok: true });
}

export type ReorderBoardResult = { ok: true } | Err;

/**
 * Persist the kanban board layout in one shot: each column's ordered IDs
 * become that column's status + position, and the flat top-to-bottom (column
 * by column, left to right) order becomes `list_order` for the legacy single
 * list view. Validates that the payload matches the caller's task set and
 * that each id maps to a uuid the caller owns.
 */
export async function reorderTodoBoard(input: {
  columns: Record<TodoStatus, string[]>;
}): Promise<ReorderBoardResult> {
  const orderedIdsByColumn = input.columns;
  const flatIds: string[] = [];
  for (const status of TODO_STATUSES) {
    const ids = orderedIdsByColumn[status] ?? [];
    for (const id of ids) {
      if (!isUuid(id)) {
        return { ok: false, message: "Invalid item id in board order." };
      }
      flatIds.push(id);
    }
  }

  if (new Set(flatIds).size !== flatIds.length) {
    return { ok: false, message: "Duplicate task in board order." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: rows } = await supabase
    .from("todo_items")
    .select("id")
    .eq("user_id", user.id);

  const allowed = new Set((rows ?? []).map((r) => r.id));
  if (flatIds.length !== allowed.size) {
    return { ok: false, message: "Board order must include every task." };
  }
  for (const id of flatIds) {
    if (!allowed.has(id)) {
      return { ok: false, message: "Unknown task in board order." };
    }
  }

  let globalOrder = 0;
  for (const status of TODO_STATUSES) {
    const ids = orderedIdsByColumn[status] ?? [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      const { error } = await supabase
        .from("todo_items")
        .update({
          status,
          position: i,
          list_order: globalOrder,
          progress_percent: progressPercentForStatus(status),
          last_stale_notification_at: null,
        })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        return { ok: false, message: error.message };
      }
      globalOrder++;
    }
  }

  return ok({ ok: true });
}

export type ReorderListResult = { ok: true } | Err;

/** Sets `list_order` for the user’s full list (single column UI). */
export async function reorderTodoList(input: {
  orderedIds: string[];
}): Promise<ReorderListResult> {
  for (const id of input.orderedIds) {
    if (!isUuid(id)) {
      return { ok: false, message: "Invalid item id in order." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: rows } = await supabase
    .from("todo_items")
    .select("id")
    .eq("user_id", user.id);

  const allowed = new Set((rows ?? []).map((r) => r.id));
  if (input.orderedIds.length !== allowed.size) {
    return { ok: false, message: "Order must include every task." };
  }
  for (const id of input.orderedIds) {
    if (!allowed.has(id)) {
      return { ok: false, message: "Unknown task in order." };
    }
  }

  for (let i = 0; i < input.orderedIds.length; i++) {
    const { error } = await supabase
      .from("todo_items")
      .update({ list_order: i, last_stale_notification_at: null })
      .eq("id", input.orderedIds[i])
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  return ok({ ok: true });
}
