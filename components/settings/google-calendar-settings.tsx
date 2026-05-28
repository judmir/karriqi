"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GoogleCalendarDisconnectDialog } from "@/components/calendar/google-calendar-disconnect-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { GoogleCalendarConnectionStatus } from "@/lib/google-calendar/connection-actions";

type GoogleCalendarSettingsProps = {
  initialStatus: GoogleCalendarConnectionStatus;
};

export function GoogleCalendarSettings({
  initialStatus,
}: GoogleCalendarSettingsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  if (!status.configured) {
    return (
      <p className="text-muted-foreground text-sm">
        Google Calendar sync is not configured on this server. Set{" "}
        <code className="text-foreground/90">GOOGLE_CLIENT_ID</code> and{" "}
        <code className="text-foreground/90">GOOGLE_CLIENT_SECRET</code> in
        the server environment.
      </p>
    );
  }

  async function handleSync() {
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/google/calendar/sync", {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        pulled?: number;
        pushed?: number;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed.");
        return;
      }
      toast.success(
        `Synced with Google (${data.pulled ?? 0} pulled, ${data.pushed ?? 0} pushed).`,
      );
      setStatus((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
      }));
    } catch {
      toast.error("Sync failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/google/calendar/disconnect", {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Disconnect failed.");
        return;
      }
      setStatus((prev) => ({
        ...prev,
        connected: false,
        googleEmail: null,
        lastSyncedAt: null,
      }));
      setDisconnectOpen(false);
      toast.success("Google Calendar disconnected.");
      router.refresh();
    } catch {
      toast.error("Disconnect failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!status.connected) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Connect your Google account to sync events between Karriqi and Google
          Calendar (primary calendar, two-way sync).
        </p>
        <a
          href="/api/integrations/google/calendar/authorize"
          className={buttonVariants()}
          aria-disabled={busy}
        >
          Connect Google Calendar
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Connected as{" "}
        <span className="text-foreground font-medium">
          {status.googleEmail ?? "Google account"}
        </span>
        .
        {status.lastSyncedAt ? (
          <>
            {" "}
            Last synced{" "}
            {formatDistanceToNow(new Date(status.lastSyncedAt), {
              addSuffix: true,
            })}
            .
          </>
        ) : null}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleSync()}
          disabled={busy}
        >
          {busy ? "Working…" : "Sync now"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDisconnectOpen(true)}
          disabled={busy}
        >
          Disconnect
        </Button>
      </div>
      <GoogleCalendarDisconnectDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        onConfirm={handleDisconnect}
        busy={busy}
      />
    </div>
  );
}
