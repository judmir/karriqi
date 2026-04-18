# Notifications (scaffold only)

Phase 1 defines **contracts and placeholders** so feature work does not scatter ad hoc logic later.

## Files

| File                                                                                        | Role                                                                      |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`lib/notifications/types.ts`](../lib/notifications/types.ts)                               | `Notification`, channels, priority                                        |
| [`lib/notifications/notification-service.ts`](../lib/notifications/notification-service.ts) | `NotificationService` interface + **`createNotificationService()`** no-op |
| [`lib/notifications/README.md`](../lib/notifications/README.md)                             | Short integration map                                                     |
| [`hooks/use-notification-subscription.ts`](../hooks/use-notification-subscription.ts)       | Client hook stub; **`AppShell`** calls it with `userId` (no-op today)     |

## Planned integration (not implemented)

1. **In-app / Supabase Realtime:** subscribe to a channel (e.g. per user or per household), push rows into UI state or a query cache.
2. **Web push:** `PushManager.subscribe`, store subscription server-side, send via VAPID + Edge Function — see [`lib/push/README.md`](../lib/push/README.md).

Keep transports behind **`NotificationService`** (or thin adapters) so modules do not import Realtime or Workbox directly.
