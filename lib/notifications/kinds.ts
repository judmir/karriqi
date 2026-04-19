export const NOTIFICATION_KINDS = {
  shoppingListUpdated: "shopping_list_updated",
  todoTagged: "todo_tagged",
  todoStale: "todo_stale",
} as const;

export type NotificationKind =
  (typeof NOTIFICATION_KINDS)[keyof typeof NOTIFICATION_KINDS];
