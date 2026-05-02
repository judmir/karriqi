"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DevPushTest() {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/dev/push-test", { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(
          typeof err.error === "string" ? err.error : "Push test failed.",
        );
        return;
      }
      toast.success("Push sent. Check your notifications for this device.");
    } catch (e) {
      console.error(e);
      toast.error("Could not send test push.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-foreground text-sm font-semibold">
          Push notifications
        </h3>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Sends a test web push to every subscription saved for your account.
          Enable notifications in Settings first.
        </p>
      </div>
      <Button type="button" onClick={() => void run()} disabled={busy}>
        {busy ? "Sending..." : "Send test push"}
      </Button>
    </div>
  );
}
