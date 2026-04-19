export type NotificationChannel = "in_app" | "web_push";

import type { NotificationKind } from "./kinds";

export type NotificationPriority = "low" | "normal" | "high";

export type Notification = {
  id: string;
  kind: NotificationKind | string;
  title: string;
  body?: string;
  /** e.g. `/shopping`, deep link target when the user taps */
  href?: string;
  createdAt: string;
  readAt?: string | null;
  priority: NotificationPriority;
  channels: NotificationChannel[];
};

export type NotificationListResult = {
  items: Notification[];
  nextCursor?: string;
};
