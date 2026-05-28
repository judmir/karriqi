"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GoogleCalendarDisconnectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
};

export function GoogleCalendarDisconnectDialog({
  open,
  onOpenChange,
  onConfirm,
  busy = false,
}: GoogleCalendarDisconnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Disconnect Google Calendar?</DialogTitle>
          <DialogDescription>
            Sync will stop and Google events will no longer appear in Karriqi.
            Events already saved here stay in your account. You can connect
            Google again anytime from this page or Settings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? "Disconnecting…" : "Disconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
