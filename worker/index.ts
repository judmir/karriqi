/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const MARK_COMPLETE_ACTION = "mark_complete";

type PushAction = {
  action: string;
  title: string;
};

type NotificationData = {
  href?: string;
  id?: string;
  kind?: string;
  actionContext?: Record<string, unknown>;
};

self.addEventListener("push", (event: PushEvent) => {
  let title = "Karriqi";
  let body = "";
  let href = "/";
  let notificationId = "";
  let kind = "";
  let actions: PushAction[] = [];
  let actionContext: Record<string, unknown> | undefined;

  try {
    if (event.data) {
      const parsed = event.data.json() as {
        id?: string;
        title?: string;
        body?: string;
        href?: string;
        kind?: string;
        actions?: PushAction[];
        actionContext?: Record<string, unknown>;
      };
      notificationId = parsed.id ?? "";
      title = parsed.title ?? title;
      body = parsed.body ?? "";
      href = parsed.href ?? href;
      kind = parsed.kind ?? "";
      actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      actionContext = parsed.actionContext;
    }
  } catch {
    const t = event.data?.text();
    if (t) body = t;
  }

  if (!notificationId && self.crypto?.randomUUID) {
    notificationId = self.crypto.randomUUID();
  }

  const notificationActions = actions.map((item) => ({
    action: item.action,
    title: item.title,
  }));

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      /** Unique tag so the OS never treats a later push as an update to the previous one. */
      tag: notificationId || `karriqi-${Date.now()}`,
      timestamp: Date.now(),
      data: { href, id: notificationId, kind, actionContext },
      badge: "/icons/icon-192.png",
      icon: "/icons/icon-192.png",
      actions: notificationActions,
    }),
  );
});

async function runMarkCompleteAction(data: NotificationData): Promise<void> {
  const context = data.actionContext;
  if (!context || typeof context !== "object") {
    return;
  }

  const response = await fetch("/api/notifications/action", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: MARK_COMPLETE_ACTION,
      kind: context.kind,
      rehab_plan_event_id: context.rehab_plan_event_id,
      occurrence_at: context.occurrence_at,
      todo_item_id: context.todo_item_id,
    }),
  });

  if (response.ok) {
    await self.registration.showNotification("Marked as completed", {
      body: "Saved without opening Karriqi.",
      tag: data.id ? `${data.id}-done` : `karriqi-done-${Date.now()}`,
      silent: true,
      badge: "/icons/icon-192.png",
      icon: "/icons/icon-192.png",
    });
    return;
  }

  let message = "Could not mark as completed. Open Karriqi to try again.";
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) message = payload.message;
  } catch {
    // ignore
  }

  await self.registration.showNotification("Action failed", {
    body: message,
    tag: data.id ? `${data.id}-error` : `karriqi-error-${Date.now()}`,
    badge: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  });
}

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  const data = (event.notification.data ?? {}) as NotificationData;
  event.notification.close();

  if (event.action === MARK_COMPLETE_ACTION) {
    event.waitUntil(runMarkCompleteAction(data));
    return;
  }

  const href = data.href ?? "/";
  const url = new URL(href, self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});
