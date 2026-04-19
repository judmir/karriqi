import { todoTaskPath } from "@/config/routes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import { createAdminClient } from "@/lib/supabase/admin";

const STALE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Finds assigned tasks with no activity bump past `STALE_MS`, sends one reminder
 * per task, sets `last_stale_notification_at`. Caller must be authorized (e.g. cron secret).
 */
export async function runStaleTaskNotifications(): Promise<{
  notified: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { notified: 0 };

  const cutoff = new Date(Date.now() - STALE_MS).toISOString();

  const { data: rows, error } = await admin
    .from("todo_items")
    .select("id, title, assigned_user_id, updated_at, last_stale_notification_at")
    .not("assigned_user_id", "is", null)
    .neq("status", "done")
    .is("last_stale_notification_at", null)
    .lt("updated_at", cutoff);

  if (error || !rows?.length) {
    if (error) console.error("[stale-tasks] query failed:", error.message);
    return { notified: 0 };
  }

  let notified = 0;

  for (const row of rows) {
    const assignee = row.assigned_user_id;
    if (!assignee) continue;

    const title = "Task needs attention";
    const body = row.title?.trim()
      ? `No updates for a while: ${row.title.trim()}`
      : "A task assigned to you has been inactive.";

    await dispatchNotification({
      kind: NOTIFICATION_KINDS.todoStale,
      recipientUserIds: [assignee],
      title,
      body,
      href: todoTaskPath(row.id),
      metadata: { todo_item_id: row.id },
    });

    const { error: upErr } = await admin
      .from("todo_items")
      .update({ last_stale_notification_at: new Date().toISOString() })
      .eq("id", row.id);

    if (!upErr) notified += 1;
    else console.error("[stale-tasks] update failed:", upErr.message);
  }

  return { notified };
}
