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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const syncLabel = lastSyncedAt
    ? `Last synced ${format(new Date(lastSyncedAt), "HH:mm")}`
    : googleEmail
      ? `Synced with ${googleEmail}`
      : "Sync Google Calendar";

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

      toast.success("Google Calendar disconnected.");
      setDisconnectOpen(false);
      router.refresh();
    } catch {
      toast.error("Disconnect failed.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onSync}
        disabled={syncing || disconnecting}
        title={syncLabel}
        aria-label={syncing ? "Syncing Google Calendar" : syncLabel}
      >
        <RefreshCwIcon className={syncing ? "animate-spin" : undefined} />
        {syncing ? "Syncing…" : "Sync"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="max-w-[11rem] justify-between gap-1.5"
              disabled={disconnecting}
              aria-label="Google Calendar options"
            />
          }
        >
          <span className="truncate">
            {googleEmail ? googleEmail.split("@")[0] : "Google"}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          {googleEmail ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="max-w-[14rem] truncate font-normal">
                  {googleEmail}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem
            onClick={onSync}
            disabled={syncing || disconnecting}
          >
            <RefreshCwIcon />
            Sync now
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDisconnectOpen(true)}
            disabled={disconnecting}
          >
            <UnplugIcon />
            Disconnect…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GoogleCalendarDisconnectDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        onConfirm={handleDisconnect}
        busy={disconnecting}
      />
    </>
  );
}
