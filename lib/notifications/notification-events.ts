import { ROUTES, todoTaskPath } from "@/config/routes";
import { fetchAssignableMembers } from "@/lib/todo/fetch-assignable-members";

import { dispatchNotification } from "./dispatch";
import { getHouseholdPeerUserIds } from "./household-peers";
import { NOTIFICATION_KINDS } from "./kinds";
import { resolveMentionedUserIds } from "./mention-resolve";

/** Notify household peers when the shopping list is saved (excluding actor). */
export async function notifyShoppingListSaved(actorUserId: string): Promise<void> {
  const peers = await getHouseholdPeerUserIds(actorUserId);
  const recipients = peers.filter((id) => id !== actorUserId);
  if (recipients.length === 0) return;

  await dispatchNotification({
    kind: NOTIFICATION_KINDS.shoppingListUpdated,
    recipientUserIds: recipients,
    title: "Shopping list updated",
    body: "The shared shopping list was changed.",
    href: ROUTES.shopping,
  });
}

export type TodoCommentTaggedContext = {
  /** Task owner (`todo_items.user_id`). */
  todoOwnerUserId: string;
  todoItemId: string;
  todoTitle: string;
  commentBody: string;
  authorUserId: string;
};

/**
 * Notify users @mentioned in a task comment (matched to assignable display names).
 */
export async function notifyTodoCommentMentions(
  ctx: TodoCommentTaggedContext,
): Promise<void> {
  const members = await fetchAssignableMembers();
  const recipientUserIds = resolveMentionedUserIds(
    ctx.commentBody,
    members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
    })),
    ctx.authorUserId,
  );

  if (recipientUserIds.length === 0) return;

  const title = "You were mentioned in a task";
  const body = ctx.todoTitle.trim()
    ? `On: ${ctx.todoTitle.trim()}`
    : "On a task";

  await dispatchNotification({
    kind: NOTIFICATION_KINDS.todoTagged,
    recipientUserIds,
    title,
    body,
    href: todoTaskPath(ctx.todoItemId),
    metadata: {
      todo_item_id: ctx.todoItemId,
      todo_owner_user_id: ctx.todoOwnerUserId,
    },
  });
}
