import type { NotificationKind } from "@/lib/notifications/kinds";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import type { Json } from "@/types/database";

export const PUSH_NOTIFICATION_ACTION = {
  markComplete: "mark_complete",
} as const;

export type PushNotificationActionId =
  (typeof PUSH_NOTIFICATION_ACTION)[keyof typeof PUSH_NOTIFICATION_ACTION];

export type PushNotificationAction = {
  action: PushNotificationActionId;
  title: string;
};

export type PushActionContext = Record<string, Json | undefined>;

const MARK_COMPLETE_ACTION: PushNotificationAction = {
  action: PUSH_NOTIFICATION_ACTION.markComplete,
  title: "Mark as completed",
};

/** Notification kinds that expose a Mark as completed action on the push banner. */
const MARK_COMPLETE_KINDS: ReadonlySet<NotificationKind> = new Set([
  NOTIFICATION_KINDS.rehabReminder,
  NOTIFICATION_KINDS.todoStale,
]);

export function pushActionsForKind(
  kind: NotificationKind,
): PushNotificationAction[] {
  if (MARK_COMPLETE_KINDS.has(kind)) {
    return [MARK_COMPLETE_ACTION];
  }
  return [];
}

export function pushActionContextForDispatch(input: {
  kind: NotificationKind;
  metadata?: Json;
}): PushActionContext | undefined {
  if (!pushActionsForKind(input.kind).length) {
    return undefined;
  }

  if (!input.metadata || typeof input.metadata !== "object" || Array.isArray(input.metadata)) {
    return { kind: input.kind };
  }

  return {
    kind: input.kind,
    ...(input.metadata as Record<string, Json>),
  };
}
