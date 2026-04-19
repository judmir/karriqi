/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event: PushEvent) => {
  let title = "Karriqi";
  let body = "";
  let href = "/";

  let notificationId = "";

  try {
    if (event.data) {
      const parsed = event.data.json() as {
        id?: string;
        title?: string;
        body?: string;
        href?: string;
      };
      notificationId = parsed.id ?? "";
      title = parsed.title ?? title;
      body = parsed.body ?? "";
      href = parsed.href ?? href;
    }
  } catch {
    const t = event.data?.text();
    if (t) body = t;
  }

  if (!notificationId && self.crypto?.randomUUID) {
    notificationId = self.crypto.randomUUID();
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      /** Unique tag so the OS never treats a later push as an update to the previous one. */
      tag: notificationId || `karriqi-${Date.now()}`,
      timestamp: Date.now(),
      data: { href, id: notificationId },
      badge: "/icons/icon-192.png",
      icon: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const data = event.notification.data as { href?: string } | undefined;
  const href = data?.href ?? "/";
  const url = new URL(href, self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});
