"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { isUuid } from "@/lib/shopping/is-uuid";
import { userMayAssignTask } from "@/lib/todo/fetch-assignable-members";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { TodoStatus } from "@/types/todo";

type TodoItemUpdate = Database["public"]["Tables"]["todo_items"]["Update"];

function ok<T extends { ok: true }>(x: T): T {
  revalidatePath(ROUTES.todo);
  return x;
}

type Err = { ok: false; message: string };

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

  if (input.progressPercent !== undefined) {
    if (input.progressPercent !== null) {
      const p = input.progressPercent;
      if (p < 0 || p > 100 || !Number.isInteger(p)) {
        return { ok: false, message: "Progress must be an integer 0–100." };
      }
    }
    patch.progress_percent = input.progressPercent;
  }

  if (input.status !== undefined && input.status !== existing.status) {
    patch.status = input.status;
    patch.position = await nextPositionForStatus(
      supabase,
      user.id,
      input.status,
    );
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
    .select("id")
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

  const { error } = await supabase
    .from("todo_subtasks")
    .update({ done: input.done })
    .eq("id", input.id);

  if (error) {
    return { ok: false, message: error.message };
  }

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

  const { error } = await supabase.from("todo_subtasks").delete().eq("id", input.id);

  if (error) {
    return { ok: false, message: error.message };
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
      .update({ list_order: i })
      .eq("id", input.orderedIds[i])
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  return ok({ ok: true });
}
