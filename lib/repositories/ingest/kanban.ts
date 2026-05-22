import type { SupabaseClient } from "@supabase/supabase-js";

import type { IngestResult } from "@/lib/ingest/http";
import { isUuid } from "@/lib/shopping/is-uuid";
import { ingestAssigneeAllowed } from "@/lib/ingest/assignee";
import { progressPercentForStatus } from "@/lib/todo/progress-for-status";
import type { KanbanIngestBody, KanbanTaskIngest } from "@/modules/ingest/schemas/kanban";
import type { Database } from "@/types/database";
import type { TodoStatus } from "@/types/todo";

async function nextPositionForStatus(
  admin: SupabaseClient<Database>,
  userId: string,
  status: TodoStatus,
): Promise<number> {
  const { data: rows } = await admin
    .from("todo_items")
    .select("position")
    .eq("user_id", userId)
    .eq("status", status)
    .order("position", { ascending: false })
    .limit(1);

  return (rows?.[0]?.position ?? -1) + 1;
}

async function nextListOrder(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data: rows } = await admin
    .from("todo_items")
    .select("list_order")
    .eq("user_id", userId)
    .order("list_order", { ascending: false })
    .limit(1);

  return (rows?.[0]?.list_order ?? -1) + 1;
}

async function ingestOneTask(
  admin: SupabaseClient<Database>,
  userId: string,
  task: KanbanTaskIngest,
): Promise<IngestResult> {
  const status: TodoStatus = task.status ?? "backlog";

  if (task.id && isUuid(task.id)) {
    const { data: existing, error: readError } = await admin
      .from("todo_items")
      .select("id, status")
      .eq("id", task.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      throw new Error(readError.message);
    }

    if (existing) {
      const patch: Database["public"]["Tables"]["todo_items"]["Update"] = {
        title: task.title.trim(),
      };

      if (task.category !== undefined) {
        patch.category = task.category?.trim() || null;
      }
      if (task.description !== undefined) {
        patch.description = task.description?.trim() || null;
      }
      if (task.dueAt !== undefined) {
        patch.due_at = task.dueAt;
      }

      const statusChanging =
        task.status !== undefined && task.status !== existing.status;

      if (statusChanging) {
        patch.status = task.status;
        patch.position = await nextPositionForStatus(admin, userId, task.status!);
        patch.progress_percent = progressPercentForStatus(task.status!);
      } else if (task.progressPercent !== undefined) {
        patch.progress_percent = task.progressPercent;
      }

      if (task.assignedUserId !== undefined) {
        const assignee = task.assignedUserId;
        if (assignee !== null && !isUuid(assignee)) {
          throw new Error("Invalid assignee user id.");
        }
        const allowed = await ingestAssigneeAllowed(userId, assignee);
        if (!allowed) {
          throw new Error("Assignee is not allowed for this user.");
        }
        patch.assigned_user_id = assignee;
      }

      const { error } = await admin
        .from("todo_items")
        .update(patch)
        .eq("id", task.id)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      return { id: task.id, action: "updated" };
    }
  }

  const id = task.id && isUuid(task.id) ? task.id : crypto.randomUUID();
  const position = await nextPositionForStatus(admin, userId, status);
  const listOrder = await nextListOrder(admin, userId);

  let assignedUserId = userId;
  if (task.assignedUserId !== undefined && task.assignedUserId !== null) {
    if (!isUuid(task.assignedUserId)) {
      throw new Error("Invalid assignee user id.");
    }
    const allowed = await ingestAssigneeAllowed(userId, task.assignedUserId);
    if (!allowed) {
      throw new Error("Assignee is not allowed for this user.");
    }
    assignedUserId = task.assignedUserId;
  }

  const { error } = await admin.from("todo_items").insert({
    id,
    user_id: userId,
    assigned_user_id: assignedUserId,
    title: task.title.trim(),
    status,
    position,
    list_order: listOrder,
    category: task.category?.trim() || null,
    description: task.description?.trim() || null,
    due_at: task.dueAt ?? null,
    progress_percent:
      task.progressPercent ?? progressPercentForStatus(status),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id, action: "created" };
}

export async function ingestKanbanTasks(
  admin: SupabaseClient<Database>,
  body: KanbanIngestBody,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const task of body.tasks) {
    results.push(await ingestOneTask(admin, body.userId, task));
  }
  return results;
}
