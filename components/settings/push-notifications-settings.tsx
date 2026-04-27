"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { urlBase64ToUint8Array } from "@/lib/push/base64";

const emptySubscribe = () => () => {};

/** WebKit often hangs on a second `subscribe()` if a subscription already exists — reuse via `getSubscription()` instead. */
async function raceMs<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function getClientPushSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function usePushSupported(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientPushSupport, () => false);
}

type LocalPushReady = "checking" | "needs_setup" | "ready" | "denied";

export function PushNotificationsSettings() {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<LocalPushReady>("checking");
  /** Set when `serviceWorker.ready` times out — common in `next dev` (PWA worker is off). */
  const [serviceWorkerHint, setServiceWorkerHint] = useState<string | null>(null);
  const supported = usePushSupported();
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

  const refreshReady = useCallback(async () => {
    setServiceWorkerHint(null);

    if (!getClientPushSupport()) {
      setReady("needs_setup");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") {
      setReady("denied");
      return;
    }

    try {
      // Without a registered worker, `ready` never resolves — e.g. `next dev` disables the PWA worker.
      const reg = await raceMs(
        navigator.serviceWorker.ready,
        8_000,
        "Service worker",
      );
      const sub = await reg.pushManager.getSubscription();
      const ok =
        permission === "granted" && sub !== null && sub.endpoint.length > 0;
      setReady(ok ? "ready" : "needs_setup");
    } catch (e) {
      const timedOut =
        e instanceof Error &&
        (e.message.includes("timed out") || e.message.includes("Service worker"));
      setReady("needs_setup");
      if (timedOut) {
        setServiceWorkerHint(
          "No service worker became active in time. For local Web Push: add ENABLE_PWA_IN_DEV=true to .env.local, restart `pnpm dev`, then reload Settings — or run `pnpm build && pnpm start` / use your deployed URL.",
        );
      }
    }
  }, []);

  useEffect(() => {
    // Async probe (SW + PushManager); no sync external store API for getSubscription().
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration of permission + subscription state
    void refreshReady();
  }, [refreshReady]);

  async function syncSubscriptionToServer(sub: PushSubscription): Promise<boolean> {
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      toast.error("Could not read push subscription.");
      return false;
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(
        typeof err.error === "string" ? err.error : "Failed to save subscription.",
      );
      return false;
    }

    return true;
  }

  async function enable() {
    if (!vapid) {
      toast.error("Push is not configured (missing VAPID public key).");
      return;
    }

    setBusy(true);
    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "denied") {
        toast.error(
          "Notifications are blocked. Enable them for this site in system settings.",
        );
        setReady("denied");
        return;
      }

      if (permission !== "granted") {
        toast.error("Notification permission was not granted.");
        return;
      }

      const reg = await raceMs(
        navigator.serviceWorker.ready,
        20_000,
        "Service worker",
      );

      const appServerKey = urlBase64ToUint8Array(vapid) as BufferSource;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await raceMs(
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey,
          }),
          30_000,
          "Push subscription",
        );
      }

      if (!(await syncSubscriptionToServer(sub))) {
        return;
      }

      const testRes = await fetch("/api/push/test", { method: "POST" });
      const testData = (await testRes.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!testRes.ok) {
        toast.error(
          typeof testData.error === "string"
            ? testData.error
            : "Test send failed — check server logs, VAPID, and service role.",
        );
        await refreshReady();
        return;
      }

      toast.success(
        "Server sent a push. If you don’t see a macOS banner, leave this tab in the background or check Notification Center (Safari often hides banners while the site is focused).",
      );
      await refreshReady();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not enable push notifications.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      const reg = await raceMs(
        navigator.serviceWorker.ready,
        20_000,
        "Service worker",
      );

      let sub = await reg.pushManager.getSubscription();
      if (!sub && vapid) {
        const appServerKey = urlBase64ToUint8Array(vapid) as BufferSource;
        sub = await raceMs(
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey,
          }),
          30_000,
          "Push subscription",
        );
      }

      if (!sub) {
        toast.error("No push subscription. Use Enable notifications first.");
        setReady("needs_setup");
        return;
      }

      if (!(await syncSubscriptionToServer(sub))) {
        return;
      }

      const testRes = await fetch("/api/push/test", { method: "POST" });
      const testData = (await testRes.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!testRes.ok) {
        toast.error(
          typeof testData.error === "string"
            ? testData.error
            : "Test request failed.",
        );
        return;
      }

      toast.success(
        "Push accepted by Apple’s relay. The green toast here is in-app only — macOS banners may not appear while Safari/Chrome has this tab in front; try another app, then send again, or open Notification Center.",
      );
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not send test.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-muted-foreground text-sm">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  if (!vapid) {
    return (
      <p className="text-muted-foreground text-sm">
        Push is not configured. Set{" "}
        <code className="text-foreground/90">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>{" "}
        and matching private key in the server environment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        On iPhone, add Karriqi to the Home Screen first. Web Push requires an
        installed PWA there (iOS 16.4+). On Mac, allow banners for Safari or this
        app in System Settings → Notifications.
      </p>

      {ready === "denied" && (
        <p className="text-destructive text-sm">
          This site cannot show notifications — you chose Don&apos;t Allow or they
          are blocked in system settings. Re-enable them for Safari (or Karriqi)
          under System Settings → Notifications.
        </p>
      )}

      {ready === "checking" && (
        <p className="text-muted-foreground text-sm">Checking notification status…</p>
      )}

      {serviceWorkerHint && (
        <p className="text-amber-300 text-sm leading-relaxed">
          {serviceWorkerHint}
        </p>
      )}

      {ready === "needs_setup" && (
        <Button type="button" onClick={() => void enable()} disabled={busy}>
          {busy ? "Working…" : "Enable notifications"}
        </Button>
      )}

      {ready === "ready" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-muted-foreground text-sm">
              Notifications are enabled for this device.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void sendTest()}
              disabled={busy}
            >
              {busy ? "Working…" : "Send test notification"}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Green alerts on this page are normal app toasts — they are not system
            push. The real push is handled by the service worker and macOS. With
            Safari or Chrome in the foreground, many setups deliver only to{" "}
            <strong className="text-foreground/80">Notification Center</strong> or
            hide banners until you switch to another app — try that, or check
            System Settings → Notifications → Safari (or your browser).
          </p>
        </div>
      )}
    </div>
  );
}
