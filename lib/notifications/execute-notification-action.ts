import { completeRehabEventFromPush } from "@/lib/rehab/complete-rehab-event-from-push";
import { updateTodoItem } from "@/lib/todo/todo-actions";

import type { NotificationKind } from "./kinds";
import { NOTIFICATION_KINDS } from "./kinds";
import { PUSH_NOTIFICATION_ACTION, type PushNotificationActionId } from "./push-actions";

export type ExecuteNotificationActionInput = {
  action: PushNotificationActionId;
  kind: NotificationKind;
  rehab_plan_event_id?: string;
  occurrence_at?: string;
  todo_item_id?: string;
};

export type ExecuteNotificationActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function executeNotificationAction(
  input: ExecuteNotificationActionInput,
): Promise<ExecuteNotificationActionResult> {
  if (input.action !== PUSH_NOTIFICATION_ACTION.markComplete) {
    return { ok: false, message: "Unknown action." };
  }

  switch (input.kind) {
    case NOTIFICATION_KINDS.rehabReminder: {
      const eventId = input.rehab_plan_event_id?.trim();
      if (!eventId) {
        return { ok: false, message: "Missing rehab event." };
      }
      return completeRehabEventFromPush({
        eventId,
        occurrenceAt: input.occurrence_at ?? null,
      });
    }
    case NOTIFICATION_KINDS.todoStale: {
      const todoId = input.todo_item_id?.trim();
      if (!todoId) {
        return { ok: false, message: "Missing task." };
      }
      return updateTodoItem({ id: todoId, status: "done" });
    }
    default:
      return { ok: false, message: "This notification cannot be completed from here." };
  }
}
