"use client";

import { format } from "date-fns";
import { ChevronDownIcon, RefreshCwIcon, UnplugIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GoogleCalendarDisconnectDialog } from "@/components/calendar/google-calendar-disconnect-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type CalendarGoogleActionsProps = {
  googleEmail?: string | null;
  lastSyncedAt?: string | null;
  syncing?: boolean;
  onSync: () => void;
};

export function CalendarGoogleActions({
  googleEmail,
  lastSyncedAt,
  syncing = false,
  onSync,
}: CalendarGoogleActionsProps) {
  const router = useRouter();
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const syncHint = lastSyncedAt
    ? `Last synced ${format(new Date(lastSyncedAt), "HH:mm")}`
    : googleEmail
      ? `Connected as ${googleEmail}`
      : "Sync calendar events";

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/google/calendar/disconnect", {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Disconnect failed.");
        return;
      }

      toast.success("Calendar disconnected.");
      setDisconnectOpen(false);
      router.refresh();
    } catch {
      toast.error("Disconnect failed.");
    } finally {
      setDisconnecting(false);
    }
  }

  const busy = syncing || disconnecting;

  return (
    <>
      <div className="inline-flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={busy}
          title={syncHint}
          aria-label={syncing ? "Syncing calendar" : syncHint}
          className="rounded-r-none border-r-0"
        >
          <RefreshCwIcon className={cn("size-4", syncing && "animate-spin")} />
          {syncing ? "Syncing…" : "Sync"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="rounded-l-none px-2"
                disabled={busy}
                aria-label="Calendar sync options"
              />
            }
          >
            <ChevronDownIcon className="size-4 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDisconnectOpen(true)}
              disabled={busy}
            >
              <UnplugIcon />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GoogleCalendarDisconnectDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        onConfirm={handleDisconnect}
        busy={disconnecting}
      />
    </>
  );
}
